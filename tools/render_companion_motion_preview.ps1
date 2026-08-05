param(
  [string]$Root
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
public static class CompanionPreviewHash {
  public static string RowPixels(string path, int row) {
    using (var source = new Bitmap(path))
    using (var image = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
      using (var g = Graphics.FromImage(image)) g.DrawImageUnscaled(source, 0, 0);
      var rect = new Rectangle(0, row * 256, 1536, 256);
      var data = image.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      try {
        byte[] bytes = new byte[Math.Abs(data.Stride) * rect.Height];
        Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
        using (var sha = SHA256.Create()) return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
      } finally { image.UnlockBits(data); }
    }
  }
}
'@

$root = if ($Root) { [System.IO.Path]::GetFullPath($Root) } else { Split-Path -Parent $PSScriptRoot }
$sourceRoot = Join-Path $root 'art_sources\combat\task9_companions'
$recipePath = Join-Path $sourceRoot 'assembly_recipe.json'
$previewRoot = Join-Path $sourceRoot 'review_previews'
$contactPath = Join-Path $sourceRoot 'companion_motion_contact_sheet.png'
$manifestPath = Join-Path $sourceRoot 'preview_manifest.json'
$rendererPath = Join-Path $root 'tools\render_companion_motion_preview.ps1'
$recipe = Get-Content -Raw -Encoding UTF8 $recipePath | ConvertFrom-Json
$targets = @($recipe.targets.PSObject.Properties)
if ($targets.Count -ne 20) { throw "Expected 20 companion targets, got $($targets.Count)" }
New-Item -ItemType Directory -Force $previewRoot | Out-Null

$rows = @('idle','melee','ranged','support','guard','move','hit','death')
$font = [System.Drawing.Font]::new('Consolas', 15, [System.Drawing.FontStyle]::Bold)
$smallFont = [System.Drawing.Font]::new('Consolas', 12, [System.Drawing.FontStyle]::Regular)
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 228, 217, 180))
$dimBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(220, 155, 145, 125))
$gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(150, 210, 166, 86), 1)
$records = @()
try {
  foreach ($property in $targets) {
    $record = $property.Value
    $runtimePath = Join-Path $root ($record.path.TrimStart('/') -replace '/', '\\')
    $previewPath = Join-Path $previewRoot ($property.Name + '_review.png')
    $source = [System.Drawing.Bitmap]::new($runtimePath)
    $canvas = [System.Drawing.Bitmap]::new(1736, 2120, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $graphics.Clear([System.Drawing.Color]::FromArgb(255, 11, 13, 15))
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
      $graphics.DrawString($property.Name, $font, $brush, 16, 14)
      $graphics.DrawString('FULL RUNTIME 1536x2048 | each displayed cell 256x256', $smallFont, $dimBrush, 16, 40)
      $graphics.DrawImageUnscaled($source, 184, 64)
      for ($row = 0; $row -lt 8; $row++) {
        $y = 64 + $row * 256
        $graphics.DrawString(("{0}  r{1}" -f $rows[$row], $row), $font, $brush, 16, $y + 112)
        $graphics.DrawLine($gridPen, 184, $y, 1720, $y)
        for ($col = 0; $col -le 6; $col++) { $graphics.DrawLine($gridPen, 184 + $col * 256, $y, 184 + $col * 256, $y + 256) }
      }
      $graphics.DrawLine($gridPen, 184, 2112, 1720, 2112)
      $canvas.Save($previewPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $graphics.Dispose(); $canvas.Dispose(); $source.Dispose() }
    $rowRecords = @()
    for ($row = 0; $row -lt 8; $row++) {
      $rowRecords += [ordered]@{ motionKey = $rows[$row]; row = $row; pixelSha256 = [CompanionPreviewHash]::RowPixels($runtimePath, $row) }
    }
    $records += [ordered]@{
      sheetKey = $property.Name
      runtimePath = $record.path
      runtimeSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $runtimePath).Hash.ToLowerInvariant()
      previewPath = '/' + ($previewPath.Substring($root.Length + 1) -replace '\\','/')
      previewSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $previewPath).Hash.ToLowerInvariant()
      rows = $rowRecords
    }
  }

  $tileWidth = 400; $tileHeight = 540; $headerHeight = 70
  $contact = [System.Drawing.Bitmap]::new($tileWidth * 5, $headerHeight + $tileHeight * 4, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($contact)
  try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 10, 12, 14))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawString('TASK 9 - 20 COMPANION FULL-SHEET REVIEW INDEX', $font, $brush, 16, 14)
    for ($index = 0; $index -lt $records.Count; $index++) {
      $record = $records[$index]
      $preview = [System.Drawing.Bitmap]::new((Join-Path $root ($record.previewPath.TrimStart('/') -replace '/', '\\')))
      try {
        $x = ($index % 5) * $tileWidth; $y = $headerHeight + [math]::Floor($index / 5) * $tileHeight
        $graphics.DrawString($record.sheetKey, $smallFont, $brush, $x + 8, $y + 8)
        $graphics.DrawImage($preview, [System.Drawing.Rectangle]::new($x + 8, $y + 34, 384, 468))
        $graphics.DrawString('see 1:1 review board', $smallFont, $dimBrush, $x + 100, $y + 508)
      }
      finally { $preview.Dispose() }
    }
    $contact.Save($contactPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally { $graphics.Dispose(); $contact.Dispose() }

  $manifest = [ordered]@{
    version = 2
    rendererPath = '/tools/render_companion_motion_preview.ps1'
    rendererSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $rendererPath).Hash.ToLowerInvariant()
    contactPath = '/art_sources/combat/task9_companions/companion_motion_contact_sheet.png'
    contactSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $contactPath).Hash.ToLowerInvariant()
    sheets = $records
  }
  [System.IO.File]::WriteAllText($manifestPath, (($manifest | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
  Write-Host ("Task 9 review previews: {0} full-resolution boards + contact index rendered." -f $records.Count)
}
finally {
  $gridPen.Dispose(); $dimBrush.Dispose(); $brush.Dispose(); $smallFont.Dispose(); $font.Dispose()
}
