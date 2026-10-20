# PowerPoint로 PPT를 열어 슬라이드마다 PNG로 내보냄 (검수용)
# 사용법: powershell -File render.ps1 <pptx 경로> <출력 폴더> [시작 슬라이드] [끝 슬라이드]
param([string]$Pptx, [string]$OutDir, [int]$From = 1, [int]$To = 9999)
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force $OutDir | Out-Null
Get-ChildItem $OutDir -Filter "s*.png" | Remove-Item -Force
$app = New-Object -ComObject PowerPoint.Application
try {
    $pres = $app.Presentations.Open((Resolve-Path $Pptx).Path, $true, $false, $false)
    $n = $pres.Slides.Count
    $last = [Math]::Min($To, $n)
    for ($i = $From; $i -le $last; $i++) {
        $pres.Slides.Item($i).Export((Join-Path $OutDir ("s{0:D3}.png" -f $i)), "PNG", 1600, 900)
    }
    $anim = 0
    foreach ($s in $pres.Slides) { $anim += $s.TimeLine.MainSequence.Count }
    "slides=$n animationEffects=$anim"
    $pres.Close()
} finally {
    $app.Quit()
}
