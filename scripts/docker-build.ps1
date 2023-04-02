# execution policy local
# Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
# powershell.exe -ExecutionPolicy Bypass -Command "Get-ChildItem"

param(
    [string]$image = "vsc-scuri-2d4d70303b6cec98a10a9ca08c6041dc-features"
)

Write-Host "$(docker run -t --rm -v ${PWD}:/app -w /app $image ./scripts/build.sh)"


if(Test-Path $env:SPEC) {
    Write-Host "Removing $($env:SPEC)";
    Remove-Item $env:spec
} else {
    Write-Host "not found $($env:SPEC); skipping delete";
}

npx schematics .\dist\collection.json:spec .\example\promise-and-observable.component.ts --debug=false --verbose
