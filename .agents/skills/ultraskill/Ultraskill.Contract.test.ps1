$ErrorActionPreference = 'Stop'
$skill = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'SKILL.md'))
function Section([string]$Start, [string]$End) {
    $a = $skill.IndexOf($Start); if ($a -lt 0) { throw "Missing section: $Start" }
    $b = $skill.IndexOf($End, $a + $Start.Length); if ($b -lt 0) { throw "Missing section end: $End" }
    $skill.Substring($a, $b - $a)
}
function Require([string]$Text,[string]$Pattern,[string]$Message) { if ($Text -notmatch $Pattern) { throw $Message } }
$triage = Section '## Corpus triage' '## Add-a-skill checklist'
$p1 = Section '### Pass 1 — dedup' '### Pass 2 — remove'; foreach($x in 'Group items','same workflow|equivalence','name the single survivor'){Require $p1 $x "Pass 1 missing $x"}
$p2 = Section '### Pass 2 — remove' '### Pass 3 — cluster'; foreach($x in 'no route','no actionable meaning','rule-only','speculative','exact repository search','scope','zero-result output'){Require $p2 $x "Pass 2 missing $x"}
$p3 = Section '### Pass 3 — cluster' '### Pass 4 — opinion'; foreach($x in 'only survivors','underlying ability','not by subject matter','Name each cluster'){Require $p3 $x "Pass 3 missing $x"}
$p4 = Section '### Pass 4 — opinion' '`surface-only` writes'; foreach($x in 'repeated failures','routes without owners','contract requirements','search of candidate owners'){Require $p4 $x "Pass 4 missing $x"}
foreach($x in @('present','absent','could-not-tell','Never treat `could-not-tell` as `absent`','surface-only.*default','surface-only.*changes nothing','execute.*Douglas confirms','canonical registry items','owned tests','generated projections','routing documentation','deletion or retirement','push','merge','publishing','credentials','spending','product settings','outside that confirmed touch list')){Require $triage $x "Triage contract missing $x"}
$check = Section '## Add-a-skill checklist' '## The description budget'
foreach($x in @('\.agents/skills/<name>/SKILL\.md','provenance.*first','name.*product-visible','description.*150','when_to_use.*trigger','disable-model-invocation: true','user-invocable: false','surfaces.*claude.*codex.*cursor','lowercase ASCII','under 64','\.agents/manifests/skill-visibility\.json','Set-SkillVisibility\.ps1','Build-HarnessIndex\.ps1.*\.agents/INDEX\.md','skills-manifest\.json','EnsureProject','\.agents/templates/skills-manifest\.json','~/.claude/skill-projection-manifest\.json','Cursor gets thin wrappers and no manifest','writes no manifest of what it installed','~/.agents/skills','~/.claude/skills','~/.cursor/skills','Compress-SkillDescriptions\.ps1 -Verify','VerifyGlobal','compare canonical bytes','confirm both wrappers','confirm no Codex wrapper','InstallGlobal.*skipped','Stamp.*before install','missing wrapper','over-budget','skipped conditional step','could-not-tell')){Require $check $x "Add-skill checklist missing $x"}
'Ultraskill contract tests passed.'
