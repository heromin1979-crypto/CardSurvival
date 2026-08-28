param(
  [switch]$Check,
  [string]$Root
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = if ($Root) { [System.IO.Path]::GetFullPath($Root) } else { Split-Path -Parent $PSScriptRoot }
$sourceRoot = Join-Path $root 'art_sources\combat\task9_companions'
$runtimeRoot = Join-Path $root 'assets\images\combat\spritesheets'
$companionRoot = Join-Path $runtimeRoot 'companions'
$recipePath = Join-Path $sourceRoot 'assembly_recipe.json'
$provenancePath = Join-Path $sourceRoot 'generation_provenance.json'
$assemblyScriptPath = Join-Path $root 'tools\build_companion_motion_sheets.ps1'
$qualityAnalyzerPath = Join-Path $root 'tools\companion_motion_quality.mjs'
$rangedValidatorPath = Join-Path $root 'tools\verify_companion_ranged_contract.mjs'
$rangedContractPath = Join-Path $sourceRoot 'ranged_component_contract.json'
$provenanceHashPath = Join-Path $root 'tools\provenance_hash.mjs'

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

public static class CompanionMotionSheetBuilder
{
    private sealed class Component
    {
        public int Area;
        public Rectangle Bounds;
        public double CenterX;
        public double CenterY;
    }

    private sealed class CellPixelComponent
    {
        public readonly List<int> Pixels = new List<int>();
        public int MinX = 256;
        public int MinY = 256;
        public int MaxX = -1;
        public int MaxY = -1;
        public int Area { get { return Pixels.Count; } }
    }

    private static readonly Dictionary<string, Rectangle[]> CellBoundsCache = new Dictionary<string, Rectangle[]>(StringComparer.OrdinalIgnoreCase);
    private static bool IsGreen(byte r, byte g, byte b)
    {
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        if (max < 110 || max == min) return false;
        double sat = (double)(max - min) / max;
        return g == max && sat >= 0.48 && g >= Math.Max(r, b) + 28;
    }

    private static bool IsMagenta(byte r, byte g, byte b)
    {
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        if (max < 110 || max == min) return false;
        double sat = (double)(max - min) / max;
        return r >= g + 28 && b >= g + 28 && sat >= 0.48;
    }

    private static Bitmap ToArgb(string path)
    {
        using (var source = new Bitmap(path))
        {
            var copy = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(copy))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImageUnscaled(source, 0, 0);
            }
            return copy;
        }
    }

    private static void Sanitize(Bitmap image, bool magenta)
    {
        var bounds = new Rectangle(0, 0, image.Width, image.Height);
        var data = image.LockBits(bounds, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int length = Math.Abs(data.Stride) * image.Height;
            byte[] pixels = new byte[length];
            Marshal.Copy(data.Scan0, pixels, 0, length);
            for (int y = 0; y < image.Height; y++)
            {
                int row = y * Math.Abs(data.Stride);
                for (int x = 0; x < image.Width; x++)
                {
                    int offset = row + x * 4;
                    byte b = pixels[offset];
                    byte g = pixels[offset + 1];
                    byte r = pixels[offset + 2];
                    byte a = pixels[offset + 3];
                    bool keyed = magenta ? IsMagenta(r, g, b) : IsGreen(r, g, b);
                    if (a <= 12 || keyed)
                    {
                        pixels[offset] = 0;
                        pixels[offset + 1] = 0;
                        pixels[offset + 2] = 0;
                        pixels[offset + 3] = 0;
                        continue;
                    }

                    if (!magenta && g > Math.Max(r, b) + 8)
                        pixels[offset + 1] = (byte)Math.Min(255, Math.Max(r, b) + 8);
                    if (magenta && r > g + 8 && b > g + 8)
                    {
                        byte neutral = (byte)Math.Min(r, b);
                        pixels[offset] = (byte)Math.Min(neutral, g + 8);
                        pixels[offset + 2] = (byte)Math.Min(neutral, g + 8);
                    }
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, length);
        }
        finally
        {
            image.UnlockBits(data);
        }
    }

    public static void Clean(string input, string output, bool magenta)
    {
        using (var image = ToArgb(input))
        {
            Sanitize(image, magenta);
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            image.Save(output, ImageFormat.Png);
        }
    }

    public static string PixelSha256(string path)
    {
        using (var image = ToArgb(path))
        {
            var data = image.LockBits(new Rectangle(0, 0, image.Width, image.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            try
            {
                byte[] pixels = new byte[Math.Abs(data.Stride) * image.Height];
                Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
                using (var sha = SHA256.Create())
                    return BitConverter.ToString(sha.ComputeHash(pixels)).Replace("-", "").ToLowerInvariant();
            }
            finally { image.UnlockBits(data); }
        }
    }

    public static void Assemble(
        string output,
        string[] rowPaths,
        int[] sourceCols,
        int[] sourceRows,
        int[] selectedRows,
        string[] selectedColumns,
        string[] allowedRangedFingerprints)
    {
        if (rowPaths.Length != 8 || sourceCols.Length != 8 || sourceRows.Length != 8 ||
            selectedRows.Length != 8 || selectedColumns.Length != 8)
            throw new ArgumentException("Exactly eight row mappings are required.");

        using (var target = new Bitmap(1536, 2048, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(target))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;

            for (int targetRow = 0; targetRow < 8; targetRow++)
            {
                using (var source = ToArgb(rowPaths[targetRow]))
                {
                    Rectangle[] objectBounds = FindObjectBounds(source, rowPaths[targetRow], sourceCols[targetRow], sourceRows[targetRow]);
                    string[] parts = selectedColumns[targetRow].Split(',');
                    if (parts.Length != 6) throw new ArgumentException("Each row needs six source columns.");
                    for (int targetCol = 0; targetCol < 6; targetCol++)
                    {
                        int sourceCol = int.Parse(parts[targetCol]);
                        Rectangle crop = objectBounds[selectedRows[targetRow] * sourceCols[targetRow] + sourceCol];
                        if (crop.IsEmpty) continue;
                        int x0 = crop.X;
                        int y0 = crop.Y;
                        int sourceWidth = crop.Width;
                        int sourceHeight = crop.Height;
                        double scale = Math.Min(246.0 / sourceWidth, 246.0 / sourceHeight);
                        int drawWidth = Math.Max(1, (int)Math.Round(sourceWidth * scale));
                        int drawHeight = Math.Max(1, (int)Math.Round(sourceHeight * scale));
                        int drawX = targetCol * 256 + (256 - drawWidth) / 2;
                        int drawY = targetRow * 256 + (256 - drawHeight) / 2;
                        graphics.DrawImage(
                            source,
                            new Rectangle(drawX, drawY, drawWidth, drawHeight),
                            new Rectangle(x0, y0, sourceWidth, sourceHeight),
                            GraphicsUnit.Pixel);
                    }
                }
            }
            using (var normalized = NormalizeCells(target))
            {
                RemoveSmallEdgeFragments(normalized, allowedRangedFingerprints);
                Sanitize(normalized, false);
                Directory.CreateDirectory(Path.GetDirectoryName(output));
                normalized.Save(output, ImageFormat.Png);
            }
        }
    }

    private static Rectangle[] FindObjectBounds(Bitmap image, string sourcePath, int cols, int rows)
    {
        string cacheKey = sourcePath + "|" + cols + "x" + rows;
        Rectangle[] cached;
        if (CellBoundsCache.TryGetValue(cacheKey, out cached)) return cached;

        int width = image.Width;
        int height = image.Height;
        var data = image.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var components = new List<Component>();
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            byte[] visited = new byte[width * height];
            int[] queue = new int[width * height];
            for (int start = 0; start < visited.Length; start++)
            {
                if (visited[start] != 0) continue;
                int sx = start % width;
                int sy = start / width;
                if (pixels[sy * stride + sx * 4 + 3] <= 12) { visited[start] = 1; continue; }
                int head = 0, tail = 0, area = 0;
                long sumX = 0, sumY = 0;
                int minX = sx, minY = sy, maxX = sx, maxY = sy;
                queue[tail++] = start;
                visited[start] = 1;
                while (head < tail)
                {
                    int index = queue[head++];
                    int x = index % width;
                    int y = index / width;
                    area++; sumX += x; sumY += y;
                    minX = Math.Min(minX, x); minY = Math.Min(minY, y);
                    maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
                    for (int dy = -1; dy <= 1; dy++)
                    {
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            if (dx == 0 && dy == 0) continue;
                            int nx = x + dx, ny = y + dy;
                            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                            int next = ny * width + nx;
                            if (visited[next] != 0) continue;
                            if (pixels[ny * stride + nx * 4 + 3] <= 12) { visited[next] = 1; continue; }
                            visited[next] = 1;
                            queue[tail++] = next;
                        }
                    }
                }
                if (area >= 12)
                {
                    components.Add(new Component {
                        Area = area,
                        Bounds = Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1),
                        CenterX = (double)sumX / area,
                        CenterY = (double)sumY / area
                    });
                }
            }
        }
        finally
        {
            image.UnlockBits(data);
        }

        double nominalCellHeight = (double)height / rows;
        double nominalCellWidth = (double)width / cols;
        var bodyCandidates = new List<Component>();
        double minBodyHeight = Math.Min(40.0, nominalCellHeight * 0.15);
        foreach (Component component in components)
            if (component.Area >= 1500 && component.Bounds.Height >= minBodyHeight) bodyCandidates.Add(component);
        bodyCandidates.Sort(delegate(Component a, Component b) {
            int compare = a.CenterY.CompareTo(b.CenterY);
            if (compare != 0) return compare;
            compare = a.CenterX.CompareTo(b.CenterX);
            if (compare != 0) return compare;
            compare = b.Area.CompareTo(a.Area);
            if (compare != 0) return compare;
            compare = a.Bounds.X.CompareTo(b.Bounds.X);
            return compare != 0 ? compare : a.Bounds.Y.CompareTo(b.Bounds.Y);
        });
        var rowBands = new List<List<Component>>();
        foreach (Component component in bodyCandidates)
        {
            if (rowBands.Count == 0 || component.CenterY - rowBands[rowBands.Count - 1][rowBands[rowBands.Count - 1].Count - 1].CenterY > nominalCellHeight * 0.55)
                rowBands.Add(new List<Component>());
            rowBands[rowBands.Count - 1].Add(component);
        }
        if (rowBands.Count != rows)
            throw new InvalidDataException(String.Format("Detected {0} semantic row bands, expected {1}: {2}", rowBands.Count, rows, sourcePath));
        double[] rowCenters = new double[rows];
        for (int row = 0; row < rows; row++)
        {
            double sum = 0;
            foreach (Component component in rowBands[row]) sum += component.CenterY;
            rowCenters[row] = sum / rowBands[row].Count;
        }

        var grouped = new List<Component>[rows];
        for (int i = 0; i < grouped.Length; i++) grouped[i] = new List<Component>();
        foreach (Component component in components)
        {
            int nearest = 0;
            for (int row = 1; row < rows; row++)
                if (Math.Abs(component.CenterY - rowCenters[row]) < Math.Abs(component.CenterY - rowCenters[nearest])) nearest = row;
            grouped[nearest].Add(component);
        }

        var result = new Rectangle[cols * rows];
        for (int row = 0; row < rows; row++)
        {
            var bodies = new List<Component>();
            foreach (Component component in grouped[row])
                if (component.Area >= 1500 && component.Bounds.Height >= minBodyHeight) bodies.Add(component);
            bodies.Sort(delegate(Component a, Component b) {
                int compare = b.Area.CompareTo(a.Area);
                if (compare != 0) return compare;
                compare = a.CenterX.CompareTo(b.CenterX);
                if (compare != 0) return compare;
                compare = a.CenterY.CompareTo(b.CenterY);
                if (compare != 0) return compare;
                compare = a.Bounds.X.CompareTo(b.Bounds.X);
                return compare != 0 ? compare : a.Bounds.Y.CompareTo(b.Bounds.Y);
            });
            if (bodies.Count > cols) bodies.RemoveRange(cols, bodies.Count - cols);
            bodies.Sort(delegate(Component a, Component b) {
                int compare = a.CenterX.CompareTo(b.CenterX);
                if (compare != 0) return compare;
                compare = a.CenterY.CompareTo(b.CenterY);
                if (compare != 0) return compare;
                compare = b.Area.CompareTo(a.Area);
                if (compare != 0) return compare;
                compare = a.Bounds.X.CompareTo(b.Bounds.X);
                return compare != 0 ? compare : a.Bounds.Y.CompareTo(b.Bounds.Y);
            });
            for (int col = 0; col < bodies.Count; col++)
            {
                Component body = bodies[col];
                Rectangle bounds = body.Bounds;
                foreach (Component component in grouped[row])
                {
                    if (component.Area < 16 || Object.ReferenceEquals(component, body)) continue;
                    if (Math.Abs(component.CenterX - body.CenterX) > nominalCellWidth * 0.65) continue;
                    if (Math.Abs(component.CenterY - body.CenterY) > nominalCellHeight * 0.65) continue;
                    bool closerToAnotherBody = false;
                    double distance = Math.Abs(component.CenterX - body.CenterX) + Math.Abs(component.CenterY - body.CenterY);
                    foreach (Component otherBody in bodies)
                    {
                        if (Object.ReferenceEquals(otherBody, body)) continue;
                        double otherDistance = Math.Abs(component.CenterX - otherBody.CenterX) + Math.Abs(component.CenterY - otherBody.CenterY);
                        if (otherDistance < distance) { closerToAnotherBody = true; break; }
                    }
                    if (!closerToAnotherBody) bounds = Rectangle.Union(bounds, component.Bounds);
                }
                int leftLimit = col == 0
                    ? 0
                    : (int)Math.Ceiling((bodies[col - 1].CenterX + body.CenterX) / 2.0);
                int rightLimit = col == bodies.Count - 1
                    ? width
                    : (int)Math.Floor((body.CenterX + bodies[col + 1].CenterX) / 2.0);
                bounds.Inflate(4, 4);
                bounds.Intersect(Rectangle.FromLTRB(leftLimit, 0, rightLimit, height));
                result[row * cols + col] = bounds;
            }
        }
        CellBoundsCache[cacheKey] = result;
        return result;
    }

    private static int[] FindCuts(Bitmap image, int count, bool horizontal, int spanStart, int spanEnd)
    {
        int dimension = horizontal ? image.Height : image.Width;
        int[] cuts = new int[count + 1];
        cuts[0] = 0;
        cuts[count] = dimension;
        var data = image.LockBits(new Rectangle(0, 0, image.Width, image.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * image.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            double nominal = (double)dimension / count;
            int radius = Math.Max(4, (int)Math.Round(nominal * 0.34));
            for (int boundary = 1; boundary < count; boundary++)
            {
                int expected = (int)Math.Round(boundary * nominal);
                int lower = Math.Max(cuts[boundary - 1] + 4, expected - radius);
                int upper = Math.Min(dimension - (count - boundary) * 4, expected + radius);
                long bestScore = long.MaxValue;
                int best = expected;
                for (int candidate = lower; candidate <= upper; candidate++)
                {
                    int opaque = 0;
                    if (horizontal)
                    {
                        for (int x = 0; x < image.Width; x++)
                            if (pixels[candidate * stride + x * 4 + 3] > 12) opaque++;
                    }
                    else
                    {
                        int y0 = Math.Max(0, spanStart);
                        int y1 = Math.Min(image.Height, spanEnd);
                        for (int y = y0; y < y1; y++)
                            if (pixels[y * stride + candidate * 4 + 3] > 12) opaque++;
                    }
                    long score = (long)opaque * 1000L + Math.Abs(candidate - expected);
                    if (score < bestScore)
                    {
                        bestScore = score;
                        best = candidate;
                    }
                }
                cuts[boundary] = best;
            }
        }
        finally
        {
            image.UnlockBits(data);
        }
        return cuts;
    }

    private static string ComponentFingerprint(CellPixelComponent component)
    {
        var sorted = new List<int>(component.Pixels);
        sorted.Sort();
        byte[] bytes = new byte[sorted.Count * 4];
        for (int index = 0; index < sorted.Count; index++)
        {
            int value = sorted[index];
            bytes[index * 4] = (byte)(value & 255);
            bytes[index * 4 + 1] = (byte)((value >> 8) & 255);
            bytes[index * 4 + 2] = (byte)((value >> 16) & 255);
            bytes[index * 4 + 3] = (byte)((value >> 24) & 255);
        }
        using (var sha = SHA256.Create())
        {
            string shape = BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
            return "v1:" + component.Area + ":" + component.MinX + "," + component.MinY + "," + component.MaxX + "," + component.MaxY + ":" + shape;
        }
    }

    private static bool IsAllowedRangedComponent(HashSet<string> allowlist, int col, CellPixelComponent component)
    {
        string prefix = col + "|";
        string exact = prefix + ComponentFingerprint(component);
        if (allowlist.Contains(exact)) return true;
        foreach (string entry in allowlist)
        {
            if (!entry.StartsWith(prefix + "v1:", StringComparison.Ordinal)) continue;
            string[] parts = entry.Substring(prefix.Length).Split(':');
            if (parts.Length != 4) continue;
            int allowedArea;
            if (!int.TryParse(parts[1], out allowedArea) || Math.Abs(allowedArea - component.Area) > 2) continue;
            string bounds = component.MinX + "," + component.MinY + "," + component.MaxX + "," + component.MaxY;
            if (parts[2] == bounds) return true;
        }
        return false;
    }

    private static void RemoveSmallEdgeFragments(Bitmap image, string[] allowedRangedFingerprints)
    {
        var rangedAllowlist = new HashSet<string>(allowedRangedFingerprints ?? new string[0], StringComparer.Ordinal);
        var data = image.LockBits(new Rectangle(0, 0, image.Width, image.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * image.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            int[] queue = new int[256 * 256];
            for (int row = 0; row < 8; row++)
            {
                for (int col = 0; col < 6; col++)
                {
                    byte[] visited = new byte[256 * 256];
                    var components = new List<CellPixelComponent>();
                    for (int start = 0; start < visited.Length; start++)
                    {
                        if (visited[start] != 0) continue;
                        int sx = start % 256;
                        int sy = start / 256;
                        int sourceOffset = (row * 256 + sy) * stride + (col * 256 + sx) * 4;
                        if (pixels[sourceOffset + 3] <= 12) { visited[start] = 1; continue; }
                        var component = new CellPixelComponent();
                        int head = 0, tail = 0;
                        queue[tail++] = start;
                        visited[start] = 1;
                        while (head < tail)
                        {
                            int index = queue[head++];
                            int x = index % 256;
                            int y = index / 256;
                            component.Pixels.Add(index);
                            component.MinX = Math.Min(component.MinX, x);
                            component.MinY = Math.Min(component.MinY, y);
                            component.MaxX = Math.Max(component.MaxX, x);
                            component.MaxY = Math.Max(component.MaxY, y);
                            for (int dy = -1; dy <= 1; dy++)
                            {
                                for (int dx = -1; dx <= 1; dx++)
                                {
                                    if (dx == 0 && dy == 0) continue;
                                    int nx = x + dx, ny = y + dy;
                                    if (nx < 0 || nx >= 256 || ny < 0 || ny >= 256) continue;
                                    int next = ny * 256 + nx;
                                    if (visited[next] != 0) continue;
                                    int nextOffset = (row * 256 + ny) * stride + (col * 256 + nx) * 4;
                                    if (pixels[nextOffset + 3] <= 12) { visited[next] = 1; continue; }
                                    visited[next] = 1;
                                    queue[tail++] = next;
                                }
                            }
                        }
                        components.Add(component);
                    }
                    components.Sort(delegate(CellPixelComponent a, CellPixelComponent b) {
                        int compare = b.Area.CompareTo(a.Area);
                        if (compare != 0) return compare;
                        compare = a.MinX.CompareTo(b.MinX);
                        if (compare != 0) return compare;
                        compare = a.MinY.CompareTo(b.MinY);
                        if (compare != 0) return compare;
                        compare = a.MaxX.CompareTo(b.MaxX);
                        return compare != 0 ? compare : a.MaxY.CompareTo(b.MaxY);
                    });
                    if (components.Count == 0) continue;
                    int fragmentLimit = Math.Min(1600, Math.Max(400, (int)Math.Round(components[0].Area * 0.12)));
                    for (int index = 1; index < components.Count; index++)
                    {
                        CellPixelComponent component = components[index];
                        bool touchesEdge = component.MinX <= 25 || component.MinY <= 25 || component.MaxX >= 230 || component.MaxY >= 230;
                        bool preserveInternalSupportProp = row == 3 && !touchesEdge;
                        bool allowedRangedComponent = row == 2 && IsAllowedRangedComponent(rangedAllowlist, col, component);
                        if (row == 2)
                        {
                            if (allowedRangedComponent) continue;
                            throw new InvalidDataException("Unregistered ranged detached component at col " + col + ": " + ComponentFingerprint(component));
                        }
                        if (preserveInternalSupportProp || component.Area > fragmentLimit) continue;
                        foreach (int local in component.Pixels)
                        {
                            int x = local % 256;
                            int y = local / 256;
                            int offset = (row * 256 + y) * stride + (col * 256 + x) * 4;
                            pixels[offset] = 0;
                            pixels[offset + 1] = 0;
                            pixels[offset + 2] = 0;
                            pixels[offset + 3] = 0;
                        }
                    }
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally { image.UnlockBits(data); }
    }

    private static Bitmap NormalizeCells(Bitmap source)
    {
        var result = new Bitmap(1536, 2048, PixelFormat.Format32bppArgb);
        var data = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var bounds = new Rectangle[48];
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * source.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            for (int row = 0; row < 8; row++)
            {
                for (int col = 0; col < 6; col++)
                {
                    int minX = 256, minY = 256, maxX = -1, maxY = -1;
                    for (int y = 0; y < 256; y++)
                    {
                        int pixelRow = (row * 256 + y) * stride;
                        for (int x = 0; x < 256; x++)
                        {
                            int offset = pixelRow + (col * 256 + x) * 4;
                            if (pixels[offset + 3] <= 12) continue;
                            minX = Math.Min(minX, x); minY = Math.Min(minY, y);
                            maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
                        }
                    }
                    bounds[row * 6 + col] = maxX < 0
                        ? Rectangle.Empty
                        : new Rectangle(col * 256 + minX, row * 256 + minY, maxX - minX + 1, maxY - minY + 1);
                }
            }
        }
        finally
        {
            source.UnlockBits(data);
        }

        using (var graphics = Graphics.FromImage(result))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceCopy;
            for (int row = 0; row < 8; row++)
            {
                for (int col = 0; col < 6; col++)
                {
                    Rectangle crop = bounds[row * 6 + col];
                    if (crop.IsEmpty) continue;
                    int drawX = col * 256 + (256 - crop.Width) / 2;
                    int drawY = row * 256 + 250 - crop.Height;
                    graphics.DrawImage(source, new Rectangle(drawX, drawY, crop.Width, crop.Height), crop, GraphicsUnit.Pixel);
                }
            }
        }
        return result;
    }
}
'@

$sourceSpecs = [ordered]@{
  old_survivor = @{ file = 'old_survivor_companion_chroma.png'; cols = 6; rows = 7; key = 'green' }
  old_survivor_hit = @{ file = 'old_survivor_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
  old_survivor_melee_death = @{ file = 'old_survivor_melee_death_chroma.png'; cols = 6; rows = 2; key = 'green' }
  old_survivor_move_rework = @{ file = 'old_survivor_move_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  nurse = @{ file = 'nurse_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  nurse_ranged = @{ file = 'nurse_ranged_chroma.png'; cols = 6; rows = 1; key = 'green' }
  soldier_base = @{ file = 'soldier_companion_7row_chroma.png'; cols = 6; rows = 7; key = 'green' }
  soldier_ranged_rework = @{ file = 'soldier_ranged_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  soldier_guard = @{ file = 'soldier_companion_guard_source_chroma.png'; cols = 8; rows = 6; key = 'green' }
  soldier_death = @{ file = 'soldier_death_chroma.png'; cols = 6; rows = 1; key = 'green' }
  child = @{ file = 'child_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  child_hit_rework = @{ file = 'child_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  mechanic = @{ file = 'mechanic_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  mechanic_melee_guard_rework = @{ file = 'mechanic_melee_guard_rework_chroma.png'; cols = 6; rows = 2; key = 'green' }
  mechanic_guard = @{ file = 'mechanic_guard_chroma.png'; cols = 6; rows = 1; key = 'green' }
  mechanic_ranged_death = @{ file = 'mechanic_ranged_support_death_rejected_support_chroma.png'; cols = 6; rows = 3; key = 'green' }
  mechanic_support = @{ file = 'mechanic_support_chroma.png'; cols = 6; rows = 1; key = 'green' }
  student = @{ file = 'student_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  student_guard_rework = @{ file = 'student_guard_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  student_melee_ranged_support = @{ file = 'student_melee_ranged_support_chroma.png'; cols = 6; rows = 3; key = 'green' }
  student_guard_move_hit_death = @{ file = 'student_guard_move_hit_death_chroma.png'; cols = 6; rows = 4; key = 'green' }
  dog = @{ file = 'dog_companion_chroma.png'; cols = 6; rows = 8; key = 'magenta' }
  dog_hit_death_rework = @{ file = 'dog_hit_death_rework_chroma.png'; cols = 6; rows = 2; key = 'green' }
  former_colleague = @{ file = 'former_colleague_companion_chroma.png'; cols = 6; rows = 7; key = 'green' }
  former_colleague_hit = @{ file = 'former_colleague_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
  minjun = @{ file = 'minjun_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  minjun_hit_rework = @{ file = 'minjun_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  minjun_death = @{ file = 'minjun_death_chroma.png'; cols = 6; rows = 1; key = 'green' }
  sohee = @{ file = 'sohee_companion_chroma.png'; cols = 6; rows = 7; key = 'green' }
  sohee_hit = @{ file = 'sohee_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
  sohee_support_move_hit_death_rework = @{ file = 'sohee_support_move_hit_death_rework_chroma.png'; cols = 6; rows = 4; key = 'green' }
  jisu = @{ file = 'jisu_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  jisu_melee_hit_death = @{ file = 'jisu_melee_hit_death_chroma.png'; cols = 6; rows = 3; key = 'green' }
  yeongcheol_base = @{ file = 'yeongcheol_companion_base_chroma.png'; cols = 6; rows = 8; key = 'green' }
  yeongcheol_hit_rework = @{ file = 'yeongcheol_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  yeongcheol_support = @{ file = 'yeongcheol_support_chroma.png'; cols = 6; rows = 1; key = 'green' }
  daehan = @{ file = 'daehan_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  daehan_ranged = @{ file = 'daehan_ranged_chroma.png'; cols = 6; rows = 1; key = 'green' }
  daehan_ranged_hit_death_rework = @{ file = 'daehan_ranged_hit_death_rework_chroma.png'; cols = 6; rows = 3; key = 'green' }
  daehan_guard = @{ file = 'daehan_guard_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_security = @{ file = 'tower_security_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_merchant = @{ file = 'tower_merchant_companion_7col_chroma.png'; cols = 7; rows = 8; key = 'green' }
  tower_merchant_death = @{ file = 'tower_merchant_death_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_cook = @{ file = 'tower_cook_companion_chroma.png'; cols = 6; rows = 7; key = 'green' }
  tower_cook_hit = @{ file = 'tower_cook_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_cook_ranged = @{ file = 'tower_cook_ranged_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_engineer = @{ file = 'tower_engineer_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_engineer_death = @{ file = 'tower_engineer_death_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_engineer_guard = @{ file = 'tower_engineer_guard_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_doctor_base = @{ file = 'tower_doctor_companion_base_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_doctor_hit_rework = @{ file = 'tower_doctor_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_doctor_support = @{ file = 'tower_doctor_support_chroma.png'; cols = 6; rows = 1; key = 'green' }
  tower_doctor_ranged_guard_move_hit = @{ file = 'tower_doctor_ranged_guard_move_hit_chroma.png'; cols = 6; rows = 4; key = 'green' }
  tower_doctor_death = @{ file = 'tower_doctor_death_chroma.png'; cols = 6; rows = 1; key = 'green' }
  sous_chef = @{ file = 'sous_chef_companion_chroma.png'; cols = 6; rows = 7; key = 'green' }
  sous_chef_hit = @{ file = 'sous_chef_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
  sous_chef_move_rework = @{ file = 'sous_chef_move_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
  kitchen_helper = @{ file = 'kitchen_helper_companion_chroma.png'; cols = 6; rows = 7; key = 'green' }
  kitchen_helper_hit = @{ file = 'kitchen_helper_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
  kitchen_helper_supplement = @{ file = 'kitchen_helper_supplement_chroma.png'; cols = 6; rows = 5; key = 'green' }
  yeongcheol_death = @{ file = 'yeongcheol_death_chroma.png'; cols = 6; rows = 1; key = 'green' }
}

$targets = [ordered]@{
  old_survivor_companion = @{ runtime = 'companions\old_survivor_companion_sheet.png'; rows = @('old_survivor','old_survivor_melee_death','old_survivor','old_survivor','old_survivor','old_survivor_move_rework','old_survivor_hit','old_survivor_melee_death'); sourceRows = @(0,0,2,3,4,0,0,1) }
  nurse_companion = @{ runtime = 'nurse_companion_sheet.png'; rows = @('nurse','nurse','nurse_ranged','nurse','nurse','nurse','nurse','nurse'); sourceRows = @(0,1,0,3,4,5,6,7) }
  soldier_companion = @{ runtime = 'soldier_companion_sheet.png'; rows = @('soldier_base','soldier_base','soldier_ranged_rework','soldier_base','soldier_guard','soldier_base','soldier_base','soldier_death'); sourceRows = @(0,1,0,3,3,4,5,0); sourceColumns = @('0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5') }
  child_companion = @{ runtime = 'companions\child_companion_sheet.png'; rows = @('child','child','child','child','child','child','child_hit_rework','child'); sourceRows = @(0,1,2,3,4,5,0,7) }
  mechanic_companion = @{ runtime = 'companions\mechanic_companion_sheet.png'; rows = @('mechanic','mechanic_melee_guard_rework','mechanic_ranged_death','mechanic_support','mechanic_melee_guard_rework','mechanic','mechanic','mechanic_ranged_death'); sourceRows = @(0,0,0,0,1,5,6,2) }
  student_companion = @{ runtime = 'companions\student_companion_sheet.png'; rows = @('student','student_melee_ranged_support','student_melee_ranged_support','student_melee_ranged_support','student_guard_rework','student_guard_move_hit_death','student_guard_move_hit_death','student_guard_move_hit_death'); sourceRows = @(0,0,1,2,0,1,2,3) }
  dog_companion = @{ runtime = 'companions\dog_companion_sheet.png'; rows = @('dog','dog','dog','dog','dog','dog','dog_hit_death_rework','dog_hit_death_rework'); sourceRows = @(0,1,2,3,4,5,0,1) }
  former_colleague_companion = @{ runtime = 'companions\former_colleague_companion_sheet.png'; rows = @('former_colleague','former_colleague','former_colleague','former_colleague','former_colleague','former_colleague','former_colleague_hit','former_colleague'); sourceRows = @(0,1,2,3,4,5,0,6) }
  minjun_companion = @{ runtime = 'companions\minjun_companion_sheet.png'; rows = @('minjun','minjun','minjun','minjun','minjun','minjun','minjun_hit_rework','minjun_death'); sourceRows = @(0,1,2,3,4,5,0,0) }
  sohee_companion = @{ runtime = 'companions\sohee_companion_sheet.png'; rows = @('sohee','sohee','sohee','sohee_support_move_hit_death_rework','sohee','sohee_support_move_hit_death_rework','sohee_support_move_hit_death_rework','sohee_support_move_hit_death_rework'); sourceRows = @(0,1,2,0,4,1,2,3) }
  jisu_companion = @{ runtime = 'companions\jisu_companion_sheet.png'; rows = @('jisu','jisu_melee_hit_death','jisu','jisu','jisu','jisu','jisu_melee_hit_death','jisu_melee_hit_death'); sourceRows = @(0,0,2,3,4,5,1,2) }
  yeongcheol_companion = @{ runtime = 'companions\yeongcheol_companion_sheet.png'; rows = @('yeongcheol_base','yeongcheol_base','yeongcheol_base','yeongcheol_support','yeongcheol_base','yeongcheol_base','yeongcheol_hit_rework','yeongcheol_death'); sourceRows = @(0,1,2,0,4,5,0,0) }
  daehan_companion = @{ runtime = 'companions\daehan_companion_sheet.png'; rows = @('daehan','daehan','daehan_ranged_hit_death_rework','daehan','daehan_guard','daehan','daehan_ranged_hit_death_rework','daehan_ranged_hit_death_rework'); sourceRows = @(0,1,0,3,0,5,1,2) }
  tower_security_companion = @{ runtime = 'companions\tower_security_companion_sheet.png'; rows = @('tower_security') }
  tower_merchant_companion = @{ runtime = 'companions\tower_merchant_companion_sheet.png'; rows = @('tower_merchant','tower_merchant','tower_merchant','tower_merchant','tower_merchant','tower_merchant','tower_merchant','tower_merchant_death'); sourceRows = @(0,1,2,3,4,5,6,0); sourceColumns = @('0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5') }
  tower_cook_companion = @{ runtime = 'companions\tower_cook_companion_sheet.png'; rows = @('tower_cook','tower_cook','tower_cook_ranged','tower_cook','tower_cook','tower_cook','tower_cook_hit','tower_cook'); sourceRows = @(0,1,0,3,4,5,0,6) }
  tower_engineer_companion = @{ runtime = 'companions\tower_engineer_companion_sheet.png'; rows = @('tower_engineer','tower_engineer','tower_engineer','tower_engineer','tower_engineer_guard','tower_engineer','tower_engineer','tower_engineer_death'); sourceRows = @(0,1,2,3,0,5,6,0) }
  tower_doctor_companion = @{ runtime = 'companions\tower_doctor_companion_sheet.png'; rows = @('tower_doctor_base','tower_doctor_base','tower_doctor_ranged_guard_move_hit','tower_doctor_support','tower_doctor_ranged_guard_move_hit','tower_doctor_ranged_guard_move_hit','tower_doctor_hit_rework','tower_doctor_death'); sourceRows = @(0,1,0,0,1,2,0,0) }
  sous_chef_companion = @{ runtime = 'companions\sous_chef_companion_sheet.png'; rows = @('sous_chef','sous_chef','sous_chef','sous_chef','sous_chef','sous_chef_move_rework','sous_chef_hit','sous_chef'); sourceRows = @(0,1,2,3,4,0,0,6) }
  kitchen_helper_companion = @{ runtime = 'companions\kitchen_helper_companion_sheet.png'; rows = @('kitchen_helper','kitchen_helper','kitchen_helper_supplement','kitchen_helper_supplement','kitchen_helper_supplement','kitchen_helper_supplement','kitchen_helper_hit','kitchen_helper_supplement'); sourceRows = @(0,1,0,1,2,3,0,4) }
}

if (-not (Test-Path -LiteralPath $rangedContractPath)) { throw "Missing ranged component contract: $rangedContractPath" }
$rangedContract = Get-Content -Raw -Encoding UTF8 $rangedContractPath | ConvertFrom-Json
if ($rangedContract.version -ne 1 -or $rangedContract.contract -ne 'task9-ranged-detached-components-v1') { throw "Invalid ranged component contract: $rangedContractPath" }

function Expand-TargetRows($target) {
  if ($target.rows.Count -eq 1) { return @($target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0]) }
  return @($target.rows)
}

function Get-Sha256([string]$path) {
  $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  if (@('.bat','.css','.html','.js','.json','.md','.mjs','.ps1','.py','.sh','.txt') -contains $extension) {
    $hash = & node $provenanceHashPath $path
    if ($LASTEXITCODE -ne 0) { throw "Canonical provenance hashing failed: $path" }
    return ([string]$hash).Trim()
  }
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    $stream = [System.IO.File]::OpenRead($path)
    try {
      return ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
    }
    finally {
      $stream.Dispose()
    }
  }
  finally {
    $sha256.Dispose()
  }
}

$workRoot = if ($Check) { Join-Path ([System.IO.Path]::GetTempPath()) ('card-survival-task9-' + [guid]::NewGuid().ToString('N')) } else { $root }
try {
  $alphaRoot = if ($Check) { Join-Path $workRoot 'alpha' } else { $sourceRoot }
  foreach ($entry in $sourceSpecs.GetEnumerator()) {
    $sourcePath = Join-Path $sourceRoot $entry.Value.file
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing source: $sourcePath" }
    $alphaName = $entry.Value.file -replace '_chroma\.png$', '_alpha.png'
    $alphaPath = Join-Path $alphaRoot $alphaName
    [CompanionMotionSheetBuilder]::Clean($sourcePath, $alphaPath, $entry.Value.key -eq 'magenta')
    $entry.Value.alpha = $alphaName
  }

  $targetRecords = [ordered]@{}
  foreach ($entry in $targets.GetEnumerator()) {
    $target = $entry.Value
    $rowKeys = Expand-TargetRows $target
    $rowPaths = New-Object string[] 8
    $rowCols = New-Object int[] 8
    $rowRows = New-Object int[] 8
    $selectedRows = New-Object int[] 8
    $selectedColumns = New-Object string[] 8
    $rangedSheetContract = $rangedContract.sheets.PSObject.Properties[$entry.Key].Value
    if ($null -eq $rangedSheetContract -or @($rangedSheetContract.frames).Count -ne 6) { throw "Missing ranged component frames for $($entry.Key)" }
    $allowedRangedFingerprints = @()
    for ($col = 0; $col -lt 6; $col++) {
      foreach ($fingerprint in @($rangedSheetContract.frames[$col])) { $allowedRangedFingerprints += ($col.ToString() + '|' + [string]$fingerprint) }
    }
    $rowRecords = @()
    for ($row = 0; $row -lt 8; $row++) {
      $sourceKey = $rowKeys[$row]
      $source = $sourceSpecs[$sourceKey]
      $rowPaths[$row] = Join-Path $alphaRoot $source.alpha
      $rowCols[$row] = $source.cols
      $rowRows[$row] = $source.rows
      $selectedRows[$row] = if ($target.ContainsKey('sourceRows')) { $target.sourceRows[$row] } else { $row }
      $selectedColumns[$row] = if ($target.ContainsKey('sourceColumns')) { $target.sourceColumns[$row] } else { '0,1,2,3,4,5' }
      $rowRecords += [ordered]@{ targetRow = $row; source = $sourceKey; sourceRow = $selectedRows[$row]; sourceColumns = @($selectedColumns[$row].Split(',') | ForEach-Object { [int]$_ }) }
    }
    $runtimePath = Join-Path $runtimeRoot $target.runtime
    $outputPath = if ($Check) { Join-Path $workRoot $target.runtime } else { $runtimePath }
    [CompanionMotionSheetBuilder]::Assemble($outputPath, $rowPaths, $rowCols, $rowRows, $selectedRows, $selectedColumns, $allowedRangedFingerprints)
    $validationOutput = & node $rangedValidatorPath ("--root=" + $root) ("--allowed-root=" + $workRoot) ("--sheet=" + $entry.Key) ("--file=" + $outputPath) ("--expected=" + (($targets.Keys) -join ',')) 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Ranged component contract validation failed for $($entry.Key): $validationOutput" }
    if ($Check) {
      if (-not (Test-Path -LiteralPath $runtimePath)) { throw "Missing runtime target: $runtimePath" }
      $generatedFileSha = Get-Sha256 $outputPath
      $runtimeFileSha = Get-Sha256 $runtimePath
      if ($generatedFileSha -ne $runtimeFileSha) {
        $generatedPixelSha = [CompanionMotionSheetBuilder]::PixelSha256($outputPath)
        $runtimePixelSha = [CompanionMotionSheetBuilder]::PixelSha256($runtimePath)
        throw "Runtime target differs from deterministic build: $runtimePath (file $runtimeFileSha != $generatedFileSha; pixel $runtimePixelSha != $generatedPixelSha)"
      }
    }
    $targetRecords[$entry.Key] = [ordered]@{ path = '/' + ($runtimePath.Substring($root.Length + 1) -replace '\\','/'); width = 1536; height = 2048; fileSha256 = Get-Sha256 $outputPath; pixelSha256 = [CompanionMotionSheetBuilder]::PixelSha256($outputPath); rows = $rowRecords }
  }

  $canonical = [ordered]@{}
  foreach ($entry in $sourceSpecs.GetEnumerator()) {
    $sourcePath = Join-Path $sourceRoot $entry.Value.file
    $generatedAlphaPath = Join-Path $alphaRoot $entry.Value.alpha
    $canonicalAlphaPath = Join-Path $sourceRoot $entry.Value.alpha
    $canonical[$entry.Key] = [ordered]@{
      chromaPath = '/' + ($sourcePath.Substring($root.Length + 1) -replace '\\','/')
      chromaSha256 = Get-Sha256 $sourcePath
      alphaPath = '/' + ($canonicalAlphaPath.Substring($root.Length + 1) -replace '\\','/')
      alphaSha256 = Get-Sha256 $generatedAlphaPath
      cols = $entry.Value.cols
      rows = $entry.Value.rows
      key = $entry.Value.key
    }
  }
  if (-not (Test-Path -LiteralPath $provenancePath)) { throw "Missing provenance: $provenancePath" }
  if (-not (Test-Path -LiteralPath $assemblyScriptPath)) { throw "Missing assembly script: $assemblyScriptPath" }
  $computedRecipe = [ordered]@{
    version = 2
    hashScheme = 'combat-provenance-sha256-v2'
    assemblyScript = '/tools/build_companion_motion_sheets.ps1'
    assemblyScriptSha256 = Get-Sha256 $assemblyScriptPath
    qualityAnalyzerPath = '/tools/companion_motion_quality.mjs'
    qualityAnalyzerSha256 = Get-Sha256 $qualityAnalyzerPath
    rangedValidatorPath = '/tools/verify_companion_ranged_contract.mjs'
    rangedValidatorSha256 = Get-Sha256 $rangedValidatorPath
    rangedComponentContractPath = '/art_sources/combat/task9_companions/ranged_component_contract.json'
    rangedComponentContractSha256 = Get-Sha256 $rangedContractPath
    provenancePath = '/art_sources/combat/task9_companions/generation_provenance.json'
    provenanceSha256 = Get-Sha256 $provenancePath
    rowContract = @('idle','melee','ranged','support','guard','move','hit','death')
    canonicalSources = $canonical
    targets = $targetRecords
  }
  $json = $computedRecipe | ConvertTo-Json -Depth 12
  if ($Check) {
    if (-not (Test-Path -LiteralPath $recipePath)) { throw "Missing assembly recipe: $recipePath" }
    $committedJson = (Get-Content -Raw -Encoding UTF8 $recipePath | ConvertFrom-Json) | ConvertTo-Json -Depth 12
    if ($committedJson -ne $json) { throw "Assembly recipe differs from independently reconstructed build contract: $recipePath" }
  }
  else {
    [System.IO.File]::WriteAllText($recipePath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
  }

  Write-Host ("Task 9 companion sheets: {0} deterministic targets {1}." -f $targets.Count, $(if ($Check) { 'verified' } else { 'built' }))
}
finally {
  if ($Check -and (Test-Path -LiteralPath $workRoot) -and $workRoot.StartsWith([System.IO.Path]::GetTempPath(), [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force
  }
}
