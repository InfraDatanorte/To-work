"""Confere os entregáveis e gera uma folha de contato para revisão visual."""
from pathlib import Path
import json
import re
import unicodedata
import pymupdf
from docx import Document
from PIL import Image, ImageDraw

docs=Path(__file__).resolve().parent
repo=docs.parent
evidence=docs/'evidencias'
output=evidence/'revisao_documento'
output.mkdir(exist_ok=True)
pdf=pymupdf.open(docs/'Documentacao_To_Work_Atualizada.pdf')
texts=[page.get_text() for page in pdf]
normalize=lambda value: re.sub(r'\s+',' ',unicodedata.normalize('NFC',value)).strip()
content=normalize('\n'.join(texts))
catalog=json.loads((repo/'backend/src/data/serviceCategories.json').read_text(encoding='utf8'))
structure=json.loads((evidence/'estrutura_documentacao.json').read_text(encoding='utf8'))
required=['RF'+str(i).zfill(2) for i in range(1,26)]+['RNF'+str(i).zfill(2) for i in range(1,13)]
required+=['1 INTRODUÇÃO','6 CONSIDERAÇÕES FINAIS','REFERÊNCIAS BIBLIOGRÁFICAS','APÊNDICE A','APÊNDICE B','152','12 grupos','Com o que você trabalha?']
missing=[item for item in required if item not in content]
assert not missing, f'Conteúdo ausente: {missing}'
missing_categories=[name for group in catalog for name,_ in group['items'] if normalize(name) not in content]
assert not missing_categories, f'Categorias ausentes no apêndice: {missing_categories}'
for phrase in ['Nenhuma entrada de sumário','Atualize este campo no Word','TÍTULO DO PROJETO','Nome do aluno','Criar e vincular categoria; vincular existente']:
    assert phrase not in content, f'Texto desatualizado: {phrase}'
assert structure['figures']==15 and structure['tables']==11
empty=[]
for index,page in enumerate(pdf):
    body_text=re.sub(r'Página\s*\d+\s*/\s*\d+','',texts[index]).strip()
    if not body_text and not page.get_images(): empty.append(index+1)
assert not empty, f'Páginas vazias: {empty}'
doc=Document(docs/'Documentacao_To_Work_Atualizada.docx')
assert len(doc.inline_shapes)==15
toc=any('TOC ' in node.text for node in doc._element.xpath('.//w:instrText') if node.text)
assert toc
sheet=Image.new('RGB',(1200,300*((len(pdf)+5)//6)),'#e5e5e5')
draw=ImageDraw.Draw(sheet)
for index,page in enumerate(pdf):
    pix=page.get_pixmap(matrix=pymupdf.Matrix(.30,.30),alpha=False)
    thumb=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
    x=index%6*200; y=index//6*300
    draw.text((x+8,y+4),str(index+1),fill='black')
    sheet.paste(thumb,(x,y+22))
sheet.save(output/'contato_atualizado.png')
key_pages={0,1,4,len(pdf)-1}
for term in ['Catálogo de profissões e serviços','Quadro 2 – Composição','Figura 6 – Pesquisa','Figura 11 – Seleção','APÊNDICE A – EXECUÇÃO','APÊNDICE B – CATÁLOGO']:
    for index,text in enumerate(texts):
        if term in text and not ('SUMÁRIO' in text or text.count('....')>4):
            key_pages.add(index)
for index in sorted(key_pages):
    pdf[index].get_pixmap(matrix=pymupdf.Matrix(1.35,1.35)).save(output/f'atual-pagina-{index+1}.png')
report={'date':'2026-10-30','pages':len(pdf),'figures':structure['figures'],'tables':structure['tables'],'functionalRequirements':25,'nonFunctionalRequirements':12,'catalogCategoriesChecked':152,'categoryGroups':12,'blankPages':empty,'tocPresent':toc,'allExpectedContentFound':True,'visualReviewPages':[i+1 for i in sorted(key_pages)]}
(evidence/'validacao_documentacao.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
structure['pages']=len(pdf)
(evidence/'estrutura_documentacao.json').write_text(json.dumps(structure,indent=2,ensure_ascii=False),encoding='utf8')
print(json.dumps(report,indent=2,ensure_ascii=False))
for index,text in enumerate(texts):
    print(index+1,len(text),normalize(text)[:100])
