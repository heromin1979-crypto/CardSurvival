param(
  [switch]$Check
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $root 'art_sources\combat\task9_companions'
$runtimeRoot = Join-Path $root 'assets\images\combat\spritesheets'
$companionRoot = Join-Path $runtimeRoot 'companions'
$recipePath = Join-Path $sourceRoot 'assembly_recipe.json'

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class CompanionMotionSheetBuilder
{
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

    public static void Assemble(
        string output,
        string[] rowPaths,
        int[] sourceCols,
        int[] sourceRows,
        int[] selectedRows,
        string[] selectedColumns)
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
                    string[] parts = selectedColumns[targetRow].Split(',');
                    if (parts.Length != 6) throw new ArgumentException("Each row needs six source columns.");
                    for (int targetCol = 0; targetCol < 6; targetCol++)
                    {
                        int sourceCol = int.Parse(parts[targetCol]);
                        int x0 = (int)Math.Round((double)sourceCol * source.Width / sourceCols[targetRow]);
                        int x1 = (int)Math.Round((double)(sourceCol + 1) * source.Width / sourceCols[targetRow]);
                        int y0 = (int)Math.Round((double)selectedRows[targetRow] * source.Height / sourceRows[targetRow]);
                        int y1 = (int)Math.Round((double)(selectedRows[targetRow] + 1) * source.Height / sourceRows[targetRow]);
                        int sourceWidth = Math.Max(1, x1 - x0);
                        int sourceHeight = Math.Max(1, y1 - y0);
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
                Sanitize(normalized, false);
                Directory.CreateDirectory(Path.GetDirectoryName(output));
                normalized.Save(output, ImageFormat.Png);
            }
        }
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
  old_survivor = @{ file = 'old_survivor_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  nurse = @{ file = 'nurse_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  soldier_base = @{ file = 'soldier_companion_7row_chroma.png'; cols = 6; rows = 7; key = 'green' }
  soldier_guard = @{ file = 'soldier_companion_guard_source_chroma.png'; cols = 8; rows = 6; key = 'green' }
  child = @{ file = 'child_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  mechanic = @{ file = 'mechanic_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  mechanic_guard = @{ file = 'mechanic_guard_chroma.png'; cols = 6; rows = 1; key = 'green' }
  student = @{ file = 'student_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  dog = @{ file = 'dog_companion_chroma.png'; cols = 6; rows = 8; key = 'magenta' }
  former_colleague = @{ file = 'former_colleague_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  minjun = @{ file = 'minjun_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  sohee = @{ file = 'sohee_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  jisu = @{ file = 'jisu_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  yeongcheol_base = @{ file = 'yeongcheol_companion_base_chroma.png'; cols = 6; rows = 8; key = 'green' }
  yeongcheol_support = @{ file = 'yeongcheol_support_chroma.png'; cols = 6; rows = 1; key = 'green' }
  daehan = @{ file = 'daehan_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_security = @{ file = 'tower_security_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_merchant = @{ file = 'tower_merchant_companion_7col_chroma.png'; cols = 7; rows = 8; key = 'green' }
  tower_cook = @{ file = 'tower_cook_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_engineer = @{ file = 'tower_engineer_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_doctor_base = @{ file = 'tower_doctor_companion_base_chroma.png'; cols = 6; rows = 8; key = 'green' }
  tower_doctor_support = @{ file = 'tower_doctor_support_chroma.png'; cols = 6; rows = 1; key = 'green' }
  sous_chef = @{ file = 'sous_chef_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  kitchen_helper = @{ file = 'kitchen_helper_companion_chroma.png'; cols = 6; rows = 8; key = 'green' }
  kitchen_helper_hit = @{ file = 'kitchen_helper_hit_chroma.png'; cols = 6; rows = 1; key = 'green' }
}

$targets = [ordered]@{
  old_survivor_companion = @{ runtime = 'companions\old_survivor_companion_sheet.png'; rows = @('old_survivor') }
  nurse_companion = @{ runtime = 'nurse_companion_sheet.png'; rows = @('nurse') }
  soldier_companion = @{ runtime = 'soldier_companion_sheet.png'; rows = @('soldier_base','soldier_base','soldier_base','soldier_base','soldier_guard','soldier_base','soldier_base','soldier_base'); sourceRows = @(0,1,2,3,3,4,5,6); sourceColumns = @('0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5') }
  child_companion = @{ runtime = 'companions\child_companion_sheet.png'; rows = @('child') }
  mechanic_companion = @{ runtime = 'companions\mechanic_companion_sheet.png'; rows = @('mechanic','mechanic','mechanic','mechanic','mechanic_guard','mechanic','mechanic','mechanic'); sourceRows = @(0,1,2,3,0,5,6,7) }
  student_companion = @{ runtime = 'companions\student_companion_sheet.png'; rows = @('student') }
  dog_companion = @{ runtime = 'companions\dog_companion_sheet.png'; rows = @('dog') }
  former_colleague_companion = @{ runtime = 'companions\former_colleague_companion_sheet.png'; rows = @('former_colleague') }
  minjun_companion = @{ runtime = 'companions\minjun_companion_sheet.png'; rows = @('minjun') }
  sohee_companion = @{ runtime = 'companions\sohee_companion_sheet.png'; rows = @('sohee') }
  jisu_companion = @{ runtime = 'companions\jisu_companion_sheet.png'; rows = @('jisu') }
  yeongcheol_companion = @{ runtime = 'companions\yeongcheol_companion_sheet.png'; rows = @('yeongcheol_base','yeongcheol_base','yeongcheol_base','yeongcheol_support','yeongcheol_base','yeongcheol_base','yeongcheol_base','yeongcheol_base'); sourceRows = @(0,1,2,0,4,5,6,7) }
  daehan_companion = @{ runtime = 'companions\daehan_companion_sheet.png'; rows = @('daehan') }
  tower_security_companion = @{ runtime = 'companions\tower_security_companion_sheet.png'; rows = @('tower_security') }
  tower_merchant_companion = @{ runtime = 'companions\tower_merchant_companion_sheet.png'; rows = @('tower_merchant'); sourceColumns = @('0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5','0,1,2,3,4,5') }
  tower_cook_companion = @{ runtime = 'companions\tower_cook_companion_sheet.png'; rows = @('tower_cook') }
  tower_engineer_companion = @{ runtime = 'companions\tower_engineer_companion_sheet.png'; rows = @('tower_engineer') }
  tower_doctor_companion = @{ runtime = 'companions\tower_doctor_companion_sheet.png'; rows = @('tower_doctor_base','tower_doctor_base','tower_doctor_base','tower_doctor_support','tower_doctor_base','tower_doctor_base','tower_doctor_base','tower_doctor_base'); sourceRows = @(0,1,2,0,4,5,6,7) }
  sous_chef_companion = @{ runtime = 'companions\sous_chef_companion_sheet.png'; rows = @('sous_chef') }
  kitchen_helper_companion = @{ runtime = 'companions\kitchen_helper_companion_sheet.png'; rows = @('kitchen_helper','kitchen_helper','kitchen_helper','kitchen_helper','kitchen_helper','kitchen_helper','kitchen_helper_hit','kitchen_helper'); sourceRows = @(0,1,2,3,4,5,0,7) }
}

function Expand-TargetRows($target) {
  if ($target.rows.Count -eq 1) { return @($target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0], $target.rows[0]) }
  return @($target.rows)
}

function Get-Sha256([string]$path) {
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
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
    [CompanionMotionSheetBuilder]::Assemble($outputPath, $rowPaths, $rowCols, $rowRows, $selectedRows, $selectedColumns)
    if ($Check) {
      if (-not (Test-Path -LiteralPath $runtimePath)) { throw "Missing runtime target: $runtimePath" }
      if ((Get-Sha256 $outputPath) -ne (Get-Sha256 $runtimePath)) { throw "Runtime target differs from deterministic build: $runtimePath" }
    }
    $targetRecords[$entry.Key] = [ordered]@{ path = '/' + ($runtimePath.Substring($root.Length + 1) -replace '\\','/'); width = 1536; height = 2048; fileSha256 = Get-Sha256 $outputPath; rows = $rowRecords }
  }

  if (-not $Check) {
    $canonical = [ordered]@{}
    foreach ($entry in $sourceSpecs.GetEnumerator()) {
      $sourcePath = Join-Path $sourceRoot $entry.Value.file
      $alphaPath = Join-Path $sourceRoot $entry.Value.alpha
      $canonical[$entry.Key] = [ordered]@{
        chromaPath = '/' + ($sourcePath.Substring($root.Length + 1) -replace '\\','/')
        chromaSha256 = Get-Sha256 $sourcePath
        alphaPath = '/' + ($alphaPath.Substring($root.Length + 1) -replace '\\','/')
        alphaSha256 = Get-Sha256 $alphaPath
        cols = $entry.Value.cols
        rows = $entry.Value.rows
        key = $entry.Value.key
      }
    }
    $recipe = [ordered]@{
      version = 1
      assemblyScript = '/tools/build_companion_motion_sheets.ps1'
      assemblyScriptSha256 = Get-Sha256 $PSCommandPath
      rowContract = @('idle','melee','ranged','support','guard','move','hit','death')
      canonicalSources = $canonical
      targets = $targetRecords
    }
    $json = $recipe | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($recipePath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
  }

  Write-Host ("Task 9 companion sheets: {0} deterministic targets {1}." -f $targets.Count, $(if ($Check) { 'verified' } else { 'built' }))
}
finally {
  if ($Check -and (Test-Path -LiteralPath $workRoot) -and $workRoot.StartsWith([System.IO.Path]::GetTempPath(), [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force
  }
}
