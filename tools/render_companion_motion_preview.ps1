param(
  [string]$Output = 'art_sources\combat\task9_companions\companion_motion_contact_sheet.png'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root 'art_sources\combat\task9_companions\assembly_recipe.json'
$recipe = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
$targets = @($recipe.targets.PSObject.Properties)
if ($targets.Count -ne 20) { throw "Expected 20 companion targets, got $($targets.Count)" }

$tileWidth = 300
$tileHeight = 420
$headerHeight = 56
$canvas = [System.Drawing.Bitmap]::new($tileWidth * 5, $headerHeight + $tileHeight * 4, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$font = [System.Drawing.Font]::new('Consolas', 13, [System.Drawing.FontStyle]::Bold)
$smallFont = [System.Drawing.Font]::new('Consolas', 10, [System.Drawing.FontStyle]::Regular)
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(220, 212, 201, 168))
$dimBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(180, 138, 128, 112))
$borderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(90, 200, 160, 96), 1)
try {
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 10, 12, 14))
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawString('TASK 9 - COMPANION COMBAT MOTION CONTACT SHEET', $font, $brush, 16, 14)
  $graphics.DrawString('rows: idle / melee / ranged / support / guard / move / hit / death', $smallFont, $dimBrush, 16, 36)

  for ($index = 0; $index -lt $targets.Count; $index++) {
    $property = $targets[$index]
    $record = $property.Value
    $relative = $record.path.TrimStart('/') -replace '/', '\'
    $path = Join-Path $root $relative
    $col = $index % 5
    $row = [math]::Floor($index / 5)
    $x = $col * $tileWidth
    $y = $headerHeight + $row * $tileHeight
    $graphics.DrawRectangle($borderPen, $x + 4, $y + 4, $tileWidth - 8, $tileHeight - 8)
    $graphics.DrawString($property.Name, $smallFont, $brush, $x + 12, $y + 10)
    $image = [System.Drawing.Image]::FromFile($path)
    try {
      $graphics.DrawImage($image, [System.Drawing.Rectangle]::new($x + 36, $y + 34, 228, 304))
    }
    finally { $image.Dispose() }
    $graphics.DrawString('6x8 | 1536x2048 RGBA', $smallFont, $dimBrush, $x + 38, $y + 348)
    $graphics.DrawString('identity | weapon | rows | continuity', $smallFont, $dimBrush, $x + 12, $y + 374)
  }

  $outputPath = if ([System.IO.Path]::IsPathRooted($Output)) { $Output } else { Join-Path $root $Output }
  $directory = Split-Path -Parent $outputPath
  New-Item -ItemType Directory -Force $directory | Out-Null
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host $outputPath
}
finally {
  $borderPen.Dispose()
  $dimBrush.Dispose()
  $brush.Dispose()
  $smallFont.Dispose()
  $font.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}
