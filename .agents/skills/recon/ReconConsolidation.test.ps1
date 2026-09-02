$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
if(Test-Path (Join-Path $root 'capability-report') -PathType Container){throw 'capability-report remains a second package'}
$text=Get-Content (Join-Path $PSScriptRoot 'SKILL.md') -Raw
foreach($p in @('maturity','readiness','implementation path','standards and dependencies')){if($text -notmatch [regex]::Escape($p)){throw "recon missing capability-report behavior: $p"}}
$map=Get-Content (Join-Path (Split-Path $root -Parent) 'MAP.md') -Raw
if($map -match 'skills\\capability-report'){throw 'MAP still routes to capability-report'}
'PASS: capability reports resolve through recon.'
