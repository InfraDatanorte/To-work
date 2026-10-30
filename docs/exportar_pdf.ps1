param(
  [Parameter(Mandatory=$true)][string]$Documento,
  [Parameter(Mandatory=$true)][string]$Pdf
)
$ErrorActionPreference = 'Stop'
$word = $null
$documentoWord = $null
$copiaTemporaria = Join-Path ([System.IO.Path]::GetTempPath()) ('towork-documento-' + [guid]::NewGuid().ToString() + '.docx')
try {
  $entrada = (Resolve-Path -LiteralPath $Documento).Path
  $permitido = Join-Path $PSScriptRoot 'Documentacao_To_Work_Atualizada.docx'
  if ($entrada -ne $permitido) { throw 'Este exportador aceita somente o documento gerado na pasta docs, preservando os arquivos de referência.' }
  Copy-Item -LiteralPath $entrada -Destination $copiaTemporaria
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $word.AutomationSecurity = 3
  $saida = [System.IO.Path]::GetFullPath($Pdf)
  $documentoWord = $word.Documents.Open($copiaTemporaria, $false, $false)
  $documentoWord.Fields.Update() | Out-Null
  foreach ($toc in $documentoWord.TablesOfContents) { $toc.Update() }
  $documentoWord.Repaginate()
  foreach ($toc in $documentoWord.TablesOfContents) { $toc.UpdatePageNumbers() }
  $documentoWord.Save()
  $documentoWord.ExportAsFixedFormat($saida, 17)
  Write-Output ('PDF gerado: ' + $saida)
  Write-Output ('Paginas: ' + $documentoWord.ComputeStatistics(2))
  $documentoWord.Close(0)
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($documentoWord)
  $documentoWord = $null
  Copy-Item -LiteralPath $copiaTemporaria -Destination $entrada -Force
} finally {
  if ($null -ne $documentoWord) { $documentoWord.Close(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($documentoWord) }
  if ($null -ne $word) { $word.Quit(); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
  if (Test-Path -LiteralPath $copiaTemporaria) { Remove-Item -LiteralPath $copiaTemporaria -Force }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
