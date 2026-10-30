"""Gera a documentação acadêmica no modelo institucional.
Requer Python 3.12+, python-docx e Pillow. O PDF é exportado pelo Word via PS1.
"""
from pathlib import Path
from copy import deepcopy
import json
import math
import hashlib
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

REPO = Path(__file__).resolve().parents[1]
DOCS = REPO / 'docs'
WORKSPACE = REPO.parent.parent
ASSETS = DOCS / 'diagramas'
ASSETS.mkdir(exist_ok=True)
CATALOGO = json.loads((REPO/'backend/src/data/serviceCategories.json').read_text(encoding='utf8'))
TOTAL_CATEGORIAS = sum(len(grupo['items']) for grupo in CATALOGO)
TOTAL_GRUPOS = len(CATALOGO)
FONT = Path('C:/Windows/Fonts/arial.ttf')
BOLD = Path('C:/Windows/Fonts/arialbd.ttf')

def font(size=25, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)

def canvas(w, h):
    img = Image.new('RGB', (w, h), 'white')
    return img, ImageDraw.Draw(img)

def lines(draw, text, width, f):
    output = []
    for paragraph in text.split('\n'):
        line = ''
        for word in paragraph.split():
            candidate = (line + ' ' + word).strip()
            if draw.textlength(candidate, font=f) > width and line:
                output.append(line)
                line = word
            else:
                line = candidate
        output.append(line)
    return output

def label(draw, xy, text, size=25, bold=False, center=False, fill='#172033'):
    f = font(size, bold)
    draw.multiline_text(xy, text, font=f, fill=fill, anchor='mm' if center else None, align='center' if center else 'left', spacing=7)

def box(draw, rect, text, size=25, fill='#f0f3ff', ellipse=False):
    if ellipse:
        draw.ellipse(rect, fill=fill, outline='#3448c5', width=3)
    else:
        draw.rounded_rectangle(rect, radius=14, fill=fill, outline='#3448c5', width=3)
    f = font(size)
    wrapped = '\n'.join(lines(draw, text, rect[2] - rect[0] - 25, f))
    label(draw, ((rect[0]+rect[2])/2, (rect[1]+rect[3])/2), wrapped, size, center=True)

def arrow(draw, points, text='', position=None):
    draw.line(points, fill='#354052', width=3)
    x, y = points[-1]
    px, py = points[-2]
    a = math.atan2(y-py, x-px)
    draw.polygon([(x,y), (x-15*math.cos(a-.45), y-15*math.sin(a-.45)), (x-15*math.cos(a+.45), y-15*math.sin(a+.45))], fill='#354052')
    if text:
        position = position or ((points[0][0]+x)/2, (points[0][1]+y)/2-18)
        label(draw, position, text, 21, center=True)

def actor(draw, x, y, name):
    draw.ellipse((x-17,y-65,x+17,y-31), outline='#172033', width=3)
    draw.line([(x,y-31),(x,y+20)], fill='#172033', width=3)
    draw.line([(x-35,y-6),(x+35,y-6)], fill='#172033', width=3)
    draw.line([(x,y+20),(x-27,y+55)], fill='#172033', width=3)
    draw.line([(x,y+20),(x+27,y+55)], fill='#172033', width=3)
    label(draw, (x,y+85), name, 24, True, center=True)

def diagramas():
    img, dr = canvas(1500, 620)
    label(dr, (750,40), 'Arquitetura do To Work', 32, True, center=True)
    for rect, text in [((30,145,300,310),'Usuário\nCliente ou prestador'),((400,145,700,310),'React + Vite\nTelas e sessão'),((800,145,1100,310),'Node.js + Express\nValidações e regras'),((1200,145,1470,310),'SQLite\nArquivo local')]:
        box(dr,rect,text)
    arrow(dr,[(300,225),(400,225)])
    arrow(dr,[(700,225),(800,225)],'HTTP / JSON\nJWT', (750,365))
    arrow(dr,[(1100,225),(1200,225)],'SQL', (1150,115))
    box(dr,(800,425,1400,535),'Catálogo JSON: categorias, grupos e termos de pesquisa',24)
    arrow(dr,[(950,425),(950,310)])
    label(dr,(750,585),'A API complementa o catálogo no banco e fornece os grupos e termos de pesquisa à interface.',22,center=True)
    img.save(ASSETS/'arquitetura.png')

    img, dr = canvas(1500, 1100)
    label(dr,(750,35),'Casos de uso — To Work',32,True,center=True)
    dr.rounded_rectangle((330,85,1170,1030),radius=15,outline='#667085',width=2)
    actor(dr,110,250,'Visitante')
    actor(dr,110,720,'Cliente')
    actor(dr,1380,720,'Prestador')
    cases = [(380,120,700,235,'Cadastrar conta'),(800,120,1120,235,'Fazer login'),(380,300,700,415,'Buscar profissionais'),(800,300,1120,415,'Consultar perfil'),(380,480,700,595,'Solicitar serviço'),(800,480,1120,595,'Editar perfil e categorias'),(380,660,700,775,'Aceitar, recusar ou cancelar'),(800,660,1120,775,'Orçar ou recusar pedido'),(380,840,700,955,'Avaliar serviço concluído'),(800,840,1120,955,'Concluir serviço aceito')]
    for a,b,c,d,t in cases:
        box(dr,(a,b,c,d),t,23,ellipse=True)
    for end in [(380,177),(800,177),(380,357),(800,357)]:
        dr.line([(155,245),end],fill='#a4aab6',width=2)
    for end in [(380,357),(380,537),(380,717),(380,897)]:
        dr.line([(155,715),end],fill='#667085',width=2)
    for end in [(1120,537),(1120,717),(1120,897)]:
        dr.line([(1335,715),end],fill='#667085',width=2)
    # As elipses cobrem os segmentos de ligação que passam atrás dos rótulos.
    for a,b,c,d,t in cases:
        box(dr,(a,b,c,d),t,23,ellipse=True)
    img.save(ASSETS/'casos_uso.png')

    img, dr = canvas(1500, 990)
    label(dr,(750,40),'Fluxo de cadastro e autenticação',32,True,center=True)
    seq=[('Preencher cadastro',100),('Validar dados e email único',260),('Gerar hash bcrypt da senha',420),('Transação: usuário e perfil do prestador',580),('Emitir JWT e abrir o painel',740)]
    for text,y in seq:
        box(dr,(90,y,700,y+110),text,26)
    for (_,y),(_,y2) in zip(seq,seq[1:]): arrow(dr,[(395,y+110),(395,y2)])
    box(dr,(880,190,1410,320),'Login: comparar email e senha',26)
    box(dr,(880,470,1410,620),'Rota protegida:\nvalidar token e conta ativa',26)
    arrow(dr,[(1145,320),(1145,470)],'JWT', (1240,390))
    arrow(dr,[(1145,620),(1145,795),(700,795)],'Válido', (1180,710))
    label(dr,(750,935),'Dados inválidos ou token expirado recebem mensagem e bloqueio da ação.',25,center=True)
    img.save(ASSETS/'autenticacao.png')

    img, dr = canvas(1500, 820)
    label(dr,(750,45),'Ciclo da solicitação de serviço',32,True,center=True)
    for rect,text in [((30,210,330,330),'PENDENTE'),((410,210,710,330),'ORCADO'),((790,210,1090,330),'ACEITO'),((1170,210,1470,330),'CONCLUIDO'),((250,540,650,650),'RECUSADO'),((840,540,1240,650),'CANCELADO')]: box(dr,rect,text,28)
    arrow(dr,[(330,270),(410,270)],'Prestador\nOrçar', (370,140))
    arrow(dr,[(710,270),(790,270)],'Cliente\nAceitar', (750,140))
    arrow(dr,[(1090,270),(1170,270)],'Prestador\nConcluir', (1130,140))
    arrow(dr,[(180,330),(180,595),(250,595)],'Prestador recusa', (200,450))
    arrow(dr,[(560,330),(560,540)],'Cliente recusa', (575,420))
    arrow(dr,[(80,330),(80,735),(1040,735),(1040,650)],'Cliente cancela antes do aceite', (600,765))
    arrow(dr,[(680,330),(680,480),(1040,480),(1040,540)])
    label(dr,(1320,425),'Cliente avalia\numa única vez',25,center=True)
    img.save(ASSETS/'estados.png')

    img, dr = canvas(1450, 950)
    label(dr,(725,40),'Seleção de áreas de atuação do prestador',32,True,center=True)
    for rect,text in [((50,160,600,300),'API lista categorias do banco com grupos e termos do catálogo JSON'),((800,160,1400,300),'Prestador pesquisa sua profissão. Exemplo: jardineiro'),((800,435,1400,575),'Interface encontra Jardinagem e permite escolher a categoria'),((50,435,600,575),'API vincula a categoria ao próprio perfil como ATIVO'),((350,735,1100,875),'Categoria ativa aparece no perfil público e pode ser usada para solicitar serviço')]:
        box(dr,rect,text,25)
    arrow(dr,[(600,230),(800,230)])
    arrow(dr,[(1100,300),(1100,435)])
    arrow(dr,[(800,505),(600,505)])
    arrow(dr,[(325,575),(325,675),(725,675),(725,735)])
    label(dr,(725,925),'O prestador pode repetir a seleção e ativar ou desativar cada vínculo.',23,center=True)
    img.save(ASSETS/'catalogo.png')

    img, dr = canvas(1650, 1260)
    label(dr,(825,35),'Diagrama de Entidade e Relacionamento (resumido)',32,True,center=True)
    entities=[((50,100,510,385),'users',['PK id','full_name; email (único)','password_hash; account_type','active; created_at; updated_at']),((1100,100,1600,435),'provider_profiles',['PK id; FK user_id (único)','phone; city; state','description; base_price','campos legados de avaliação','created_at; updated_at']),((50,540,510,825),'categories',['PK id','name (único); description','created_at']),((1100,560,1600,865),'provider_categories',['PK id; FK provider_id','FK category_id; status','UNIQUE(provider_id, category_id)','created_at']),((50,950,790,1220),'service_requests',['PK id; FK client_id; FK provider_id; FK category_id','title; description; city; status','quote_cents; quote_message','created_at; updated_at']),((1100,1000,1600,1200),'reviews',['PK id; FK request_id (único)','rating (1 a 5); comment; created_at'])]
    for rect,title,fields in entities:
        dr.rounded_rectangle(rect,radius=12,fill='#f5f7fb',outline='#3448c5',width=3)
        label(dr,(rect[0]+20,rect[1]+15),title,28,True)
        dr.line([(rect[0],rect[1]+60),(rect[2],rect[1]+60)],fill='#3448c5',width=2)
        for i,t in enumerate(fields): label(dr,(rect[0]+18,rect[1]+80+i*36),t,22)
    arrow(dr,[(510,225),(1100,225)],'1 : 0..1', (810,200))
    arrow(dr,[(1350,435),(1350,560)],'1 : N', (1430,500))
    arrow(dr,[(510,680),(1100,680)],'1 : N', (805,655))
    arrow(dr,[(50,340),(20,340),(20,1080),(50,1080)],'1 : N', (85,890))
    arrow(dr,[(280,825),(280,950)],'1 : N', (360,890))
    arrow(dr,[(1100,365),(900,365),(900,900),(660,900),(660,950)],'1 : N', (975,480))
    arrow(dr,[(790,1100),(1100,1100)],'1 : 0..1', (945,1070))
    img.save(ASSETS/'der.png')

diagramas()
doc = Document(WORKSPACE/'modelo_documentacao.docx')
# Retém a capa e a quebra de seção que contém a arte institucional original.
cover = doc.paragraphs[:26]
for i, para in enumerate(cover):
    para.paragraph_format.line_spacing = Pt(20 if 1 <= i <= 11 else 16)
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(0)
    para.paragraph_format.first_line_indent = Cm(0)
cover[25].paragraph_format.line_spacing = Pt(1)
keep = {id(p._p) for p in cover}
body = doc._element.body
for child in list(body):
    if child.tag != qn('w:sectPr') and id(child) not in keep:
        body.remove(child)

replacements={12:'TO WORK',13:'PLATAFORMA WEB PARA CONEXÃO ENTRE CLIENTES E PRESTADORES DE SERVIÇOS',15:'RYCHARD VINICIOS FONDELIS DA SILVA\nGABRIEL LUIZ DE OLIVEIRA',16:'Projeto Interdisciplinar',17:'Mentor: Prof. Willian Aparecido Hübner do Nascimento',18:'2026',19:'Sinop-MT'}
for i,text in replacements.items():
    p=cover[i]
    if p.runs:
        p.runs[0].text=text
        for r in p.runs[1:]: r.text=''
    else: p.add_run(text)
    for run in p.runs:
        run.font.name='Arial'
        run.font.size=Pt(14 if i==13 else 12)
        run.bold=i in [12,13,15]

section=doc.sections[-1]
section.header.is_linked_to_previous=False
section.footer.is_linked_to_previous=False
section.top_margin=Cm(3.21)
section.bottom_margin=Cm(2.47)
section.left_margin=Cm(1.905)
section.right_margin=Cm(1.905)
for name in ['Normal','Heading 1','Heading 2','Heading 3']:
    s=doc.styles[name]
    s.font.name='Arial'; s.font.size=Pt(12); s.font.color.rgb=RGBColor(0,0,0)
    s.paragraph_format.line_spacing=1.5
    if name=='Normal':
        s.paragraph_format.first_line_indent=Cm(1.25)
        s.paragraph_format.space_after=Pt(6)
    else:
        s.font.bold=True
        s.paragraph_format.first_line_indent=Cm(0)
        s.paragraph_format.keep_with_next=True
        s.paragraph_format.space_before=Pt(12)
        s.paragraph_format.space_after=Pt(8)

def field(paragraph, instruction, placeholder=''):
    run=paragraph.add_run()
    begin=OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'),'begin')
    code=OxmlElement('w:instrText'); code.set(qn('xml:space'),'preserve'); code.text=instruction
    sep=OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'),'separate')
    text=OxmlElement('w:t'); text.text=placeholder
    end=OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'),'end')
    for element in [begin,code,sep,text,end]: run._r.append(element)

for p in section.footer.paragraphs: p.clear()
p=section.footer.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.RIGHT
p.paragraph_format.first_line_indent=Cm(0)
p.add_run('Página '); field(p,' PAGE '); p.add_run(' / '); field(p,' NUMPAGES ')
for r in p.runs: r.font.name='Arial'; r.font.size=Pt(9)

def p(text='', first=True):
    para=doc.add_paragraph(text)
    para.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    para.paragraph_format.keep_together=True
    para.paragraph_format.widow_control=True
    if not first: para.paragraph_format.first_line_indent=Cm(0)
    return para

def title(text):
    para=p(text,False); para.alignment=WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.space_after=Pt(18)
    para.runs[0].bold=True

def h(text,level=1): return doc.add_heading(text,level)
def page(): doc.add_page_break()

quadros=[]
def table(headers,rows,caption=None,widths=None):
    if caption:
        if caption.startswith('Quadro '):
            nome = caption.split(' – ',1)[-1]
            quadros.append(nome)
            caption=f'Quadro {len(quadros)} – {nome}'
        cap=p(caption,False); cap.paragraph_format.keep_with_next=True
        for r in cap.runs: r.font.size=Pt(10)
    t=doc.add_table(rows=1, cols=len(headers))
    t.style='Table Grid'
    if widths is None and headers[0] == 'REQ': widths = [1.7, 15.5]
    if widths is None and headers[0] == 'Teste': widths = [1.6, 12.6, 3.0]
    if widths is None and headers[0] == 'Rota': widths = [10.0, 2.4, 2.4, 2.4]
    if widths is not None:
        t.autofit=False
        for col,width in zip(t.columns,widths): col.width=Cm(width)
    for cell,text in zip(t.rows[0].cells,headers): cell.text=str(text)
    repeat=OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        for cell,text in zip(t.add_row().cells,row): cell.text=str(text)
    for i,row in enumerate(t.rows):
        pr=row._tr.get_or_add_trPr(); pr.append(OxmlElement('w:cantSplit'))
        for cell in row.cells:
            for para in cell.paragraphs:
                para.paragraph_format.first_line_indent=Cm(0)
                para.paragraph_format.line_spacing=1
                para.paragraph_format.space_after=Pt(5)
                para.paragraph_format.space_before=Pt(5)
                for r in para.runs: r.font.name='Arial'; r.font.size=Pt(10); r.bold=i==0
            if i==0:
                shading=OxmlElement('w:shd'); shading.set(qn('w:fill'),'E8EDF5'); cell._tc.get_or_add_tcPr().append(shading)
        if widths is not None:
            for cell,width in zip(row.cells,widths): cell.width=Cm(width)
    source=p('Fonte: elaboração a partir do código e das verificações do projeto (2026).',False)
    for r in source.runs: r.font.size=Pt(10)
    return t

figures=[]
def figure(name,filename,source='Elaboração a partir da implementação (2026).',max_height=17):
    idx=len(figures)+1; figures.append(name)
    cap=p(f'Figura {idx} – {name}',False)
    cap.paragraph_format.keep_with_next=True
    for r in cap.runs: r.font.size=Pt(10)
    im=Image.open(filename)
    width=min(17.2, max_height*im.width/im.height)
    para=p('',False); para.alignment=WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.line_spacing=1
    para.add_run().add_picture(str(filename),width=Cm(width))
    para.paragraph_format.keep_with_next=True
    sp=p('Fonte: '+source,False)
    for r in sp.runs: r.font.size=Pt(10)

p('SILVA, Rychard Vinicios Fondelis da; OLIVEIRA, Gabriel Luiz de. To Work: plataforma web para conexão entre clientes e prestadores de serviços. Sinop-MT, 2026. Projeto Interdisciplinar – Centro Universitário Fasipe – UNIFASIPE.',False)
title('RESUMO')
resumo=p('Este trabalho apresenta o desenvolvimento do To Work, uma plataforma web destinada a aproximar clientes e prestadores de serviços. O objetivo foi construir um fluxo de atendimento desde a descoberta do profissional até a avaliação de um serviço concluído, com uma interface consistente e uma estrutura adequada ao aprendizado. A metodologia reuniu análise do ciclo de atendimento, levantamento de requisitos, modelagem de dados, implementação incremental e testes automatizados. Foram utilizados React com Vite na interface, Node.js com Express na API e SQLite na persistência. A versão implementada oferece cadastro, autenticação, pesquisa por texto, cidade e categoria, edição do perfil profissional, solicitação de atendimento, orçamento, aceite, conclusão e avaliação. O catálogo padrão contém 152 categorias organizadas em 12 áreas, com busca por nomes de profissões e possibilidade de vincular várias áreas ao prestador. O painel permite escolher categorias existentes e controlar seus vínculos, sem apresentar um formulário de criação de categorias. A API verifica os participantes e as transições permitidas antes de alterar uma solicitação. A validação compreendeu oito testes de API, quatro testes de navegador, construção da interface e auditoria das dependências. Os cenários executados foram aprovados, incluindo consulta ao catálogo, proteção de pedidos de terceiros e recuperação de falhas de conexão. Conclui-se que a aplicação atende ao percurso acadêmico proposto com tecnologias acessíveis, mantendo publicação segura, pagamentos, agenda e comunicação entre participantes como possibilidades futuras.')
resumo.paragraph_format.line_spacing=1
kw=p('',False); kw.add_run('Palavras-chave: ').bold=True; kw.add_run('autenticação; desenvolvimento web; orçamento; prestação de serviços; React.')
page(); title('ABSTRACT')
abstract=p('This work presents To Work, a web platform that connects clients and service providers through an accessible academic architecture. The goal was to implement the workflow from professional discovery to the review of a completed service. The method included service workflow analysis, requirements identification, data modeling, incremental implementation and automated testing. The application uses React with Vite, Node.js with Express and SQLite. Features include registration, authentication, search, professional profiles, service requests, quotations, acceptance, completion and reviews. A standard catalog provides 152 categories organized into 12 groups, with profession search and multiple categories per provider. Providers select existing categories and manage their links; category creation is not available as a dashboard form. The server checks permissions and status transitions. Eight API tests and four browser tests passed, and the frontend build and dependency audits completed. The application supports the proposed academic workflow, while payments, scheduling and participant messaging remain future developments.')
abstract.paragraph_format.line_spacing=1
p('Keywords: authentication; quotation; React; service providers; web development.',False)
page(); title('HISTÓRICO DA REVISÃO')
table(['Data','Descrição','Responsabilidade'],[
('10/10/2025','Levantamento dos requisitos funcionais.','Autoria do projeto'),
('12/10/2025','Definição dos requisitos não funcionais.','Autoria do projeto'),
('15/10/2025','Elaboração de fluxogramas e protótipos iniciais.','Autoria do projeto'),
('08/06/2026','Documentação da estrutura React, Express e SQLite.','Autoria do projeto'),
('30/10/2026','Consolidação do fluxo de serviços, catálogo, interface, testes e documentação.','Autoria do projeto')])
p('A versão documentada reúne o fluxo de atendimento, a interface responsiva e o catálogo padrão de 152 categorias em 12 áreas. O painel permite vincular categorias existentes ao perfil profissional. As evidências de validação correspondem aos cenários executados em 30/10/2026.',False)
page(); title('SUMÁRIO')
toc=p('',False); field(toc,' TOC \\o "1-3" \\h \\z \\u ','Atualize este campo no Word para gerar o sumário.')
page()

h('1 INTRODUÇÃO')
p('A contratação de serviços locais envolve encontrar um profissional, compreender sua oferta, negociar um valor e acompanhar o atendimento. Quando essas informações ficam distribuídas em indicações e conversas informais, o cliente tem dificuldade para comparar alternativas e manter um registro do que foi combinado. O To Work organiza esse processo em uma plataforma web com perfis, categorias e solicitações de serviço.')
p('O projeto utiliza uma aplicação de interface composta por componentes e uma API responsável pelas regras de negócio. Essa separação permite estudar, no mesmo trabalho, desenvolvimento de interfaces, comunicação HTTP e persistência relacional. Componentes e estado são conceitos centrais do modelo de construção de interfaces apresentado pela documentação do React (REACT, 2026).')
p('A aplicação reúne cadastro e autenticação, busca de profissionais, perfil completo, orçamentos e avaliações em um ciclo de atendimento. Os recursos foram organizados de forma incremental, com tecnologias acessíveis ao desenvolvimento acadêmico. O sistema registra a negociação e o andamento, sem processar pagamentos ou verificar presencialmente a realização do serviço.')
h('1.1 Problemática',2)
p('Como oferecer a clientes e profissionais um percurso organizado entre a pesquisa e o encerramento de um serviço, com uma estrutura adequada ao desenvolvimento acadêmico? A solução precisa integrar a descoberta do profissional, a negociação e o acompanhamento do pedido, mantendo os registros e as permissões de cada participante.')
h('1.2 Justificativa',2)
p('A proposta reúne em um único ambiente a divulgação profissional, a descrição da necessidade do cliente, o orçamento e a avaliação. Cada solicitação registra sua situação atual e o valor informado; a versão não mantém uma trilha completa de alterações anteriores. Essa organização permite demonstrar persistência e controle de acesso sem depender de integrações externas no fluxo principal.')
p('No contexto acadêmico, o desenvolvimento integra modelagem relacional, validação de dados, programação com componentes, autenticação e testes. React, Express e SQLite permitem organizar essas responsabilidades com uma estrutura de fácil compreensão e manutenção. A simplicidade foi adotada como critério de desenho, em consonância com Google Engineering Practices (GOOGLE, 2026).')
h('1.3 Objetivos',2)
h('1.3.1 Geral',3)
p('Desenvolver e documentar uma plataforma web para conectar clientes e prestadores, permitindo pesquisar profissionais e acompanhar uma solicitação desde seu cadastro até a conclusão e a avaliação.')
h('1.3.2 Específicos',3)
for text in ['Oferecer uma identidade visual consistente entre as telas, mantendo uma arquitetura simples.','Implementar pesquisa por texto, cidade, categoria e termos de profissões.','Organizar 152 categorias padrão em 12 áreas, com seleção de múltiplas atividades por prestador.','Permitir ao prestador editar informações profissionais e ativar ou desativar vínculos de categorias existentes.','Implementar solicitações, orçamentos e transições de situação com autorização no servidor.','Vincular avaliações a serviços concluídos, impedindo duplicação.','Verificar os fluxos por testes de API e navegador e registrar evidências reproduzíveis.','Documentar o comportamento atual e as possibilidades futuras segundo o modelo institucional.']:
    p('• '+text,False)
h('1.4 Metodologia',2)
p('Foi adotada uma abordagem aplicada e incremental. O desenvolvimento compreendeu a definição do ciclo de atendimento, o levantamento de requisitos, a modelagem dos dados e a implementação das regras na API e na interface. A validação utilizou testes automatizados com bancos temporários, capturas de telas e conferência da migração em uma cópia do banco local.')
p('Os requisitos foram definidos a partir dos papéis de cliente e prestador e das operações necessárias para pesquisar, solicitar, negociar, concluir e avaliar um serviço. Não foram realizadas entrevistas, pesquisa de satisfação ou observação de usuários externos. As conclusões de funcionamento se limitam aos cenários documentados.')

h('2 REVISÃO DE LITERATURA')
h('2.1 Tópicos envolvidos',2)
h('2.1.1 Interface com componentes e ferramentas de construção',3)
p('Uma interface em React é formada por componentes que combinam apresentação e lógica de interação. No To Work, páginas organizam a navegação e componentes representam áreas reutilizáveis, como a barra superior, o perfil editável e as solicitações. O estado acompanha os dados dos formulários e das respostas da API; o contexto compartilha a sessão entre telas (REACT, 2026). O Vite executa o ambiente de desenvolvimento e produz os arquivos estáticos da interface no comando de build (VITE, 2026).')
h('2.1.2 API e validação no servidor',3)
p('A API recebe requisições HTTP e responde com dados JSON. O método GET consulta, POST cria, PUT substitui as informações editáveis do perfil e PATCH altera a situação do pedido ou vínculo de categoria. O Express organiza essas rotas e os middlewares. A documentação de segurança do Express recomenda atenção aos dados recebidos, à configuração e às dependências, orientando a adoção de validação e tratamento controlado de erros (EXPRESS, 2026).')
h('2.1.3 Banco relacional e transações',3)
p('No modelo relacional, tabelas armazenam entidades e chaves estrangeiras conectam registros. A relação entre profissionais e categorias é muitos para muitos e exige uma tabela de associação. O SQLite mantém a persistência em um arquivo, reduzindo a configuração necessária à demonstração. Sua documentação distingue essa finalidade da administração centralizada e da concorrência de servidores de banco de dados (SQLITE, 2026a).')
p('Uma transação agrupa operações que precisam ocorrer juntas. BEGIN inicia a unidade, COMMIT confirma e ROLLBACK desfaz as alterações diante de falha. O To Work utiliza transações para cadastrar usuário e perfil e para complementar o catálogo durante a inicialização. Cada unidade utiliza uma conexão própria, evitando intercalar comandos de requisições diferentes (SQLITE, 2026b).')
h('2.1.4 Hash de senhas, JWT e autorização',3)
p('O bcrypt produz um hash usado na comparação de senhas. Hash não é criptografia reversível: a aplicação não oferece recuperação da senha original. A implementação utilizada limita a entrada a 72 bytes, conforme a característica do algoritmo documentada pelo projeto bcrypt.js (BCRYPT.JS, 2026). O custo configurado é 10, preservando uma escolha simples para a demonstração.')
p('O JWT é emitido após cadastro ou login e validado nas rotas protegidas. A biblioteca jsonwebtoken permite definir expiração e algoritmos aceitos; nesta aplicação, o token expira em sete dias e usa HS256 (AUTH0, 2026). Autenticar identifica o usuário; autorizar determina se ele pode executar uma ação. Por isso, o servidor também confere os participantes e o estado do pedido.')
h('2.1.5 Qualidade e simplicidade',3)
p('Google Engineering Practices orienta a avaliação de desenho, funcionalidade, complexidade, testes, nomes, comentários e documentação. A recomendação de evitar complexidade desnecessária foi aplicada mantendo poucas camadas, regras explícitas e testes dos comportamentos relevantes (GOOGLE, 2026). As orientações são usadas como referência de revisão; o trabalho não apresenta certificação de qualidade nem comprovação de conformidade com uma norma específica.')
h('2.2 Comparativo de tecnologias',2)
h('2.2.1 React e páginas estáticas',3)
p('Páginas estáticas atendem bem à apresentação de conteúdo fixo. O fluxo proposto exige dados de sessão, formulários e listas que mudam conforme a API. React já estava na base e permite organizar essas interações em componentes, evitando uma reescrita. A comparação é qualitativa; não foi executado benchmark entre frameworks ou entre React e HTML estático (REACT, 2026).')
h('2.2.2 SQLite e banco cliente-servidor',3)
p('SQLite simplifica a instalação e a distribuição local, pois dispensa um serviço separado. Bancos cliente-servidor podem ser mais adequados quando há necessidade de administração centralizada e muitas escritas concorrentes. A escolha depende da carga e da operação, e não de uma afirmação genérica de maior velocidade. A documentação do SQLite fundamenta essa distinção (SQLITE, 2026a).')
benchmark=json.loads((DOCS/'evidencias/benchmark.json').read_text(encoding='utf8'))
p(f'Para produzir evidência da implementação escolhida, foi executada uma medição HTTP local com {benchmark["providers"]} prestadores fictícios, cinco requisições de aquecimento e cinquenta amostras sequenciais por rota. O ambiente utilizou Node.js {benchmark["node"]}, SQLite {benchmark["sqlite"]} e Windows. O tempo medido inclui a requisição e a leitura do JSON, sem concorrência.')
table(['Rota','Mediana (ms)','P95 (ms)','Máximo (ms)'],[(r['route'],r['medianMs'],r['p95Ms'],r['maxMs']) for r in benchmark['results']], 'Quadro 1 – Medição local da API')
p('Esses valores descrevem apenas a execução local registrada em docs/evidencias/benchmark.json. P95 indica o valor abaixo do qual ficaram aproximadamente 95% das amostras. A medição não constitui teste de carga, garantia de desempenho em produção ou comparação experimental com outro banco. O script pode ser repetido com npm run benchmark --prefix backend.')

h('3 MATERIAIS E MÉTODOS')
h('3.1 Coleta e análise de requisitos',2)
p('A análise de requisitos considerou os participantes, as informações do perfil profissional e as etapas da contratação. Foram definidas as ações permitidas ao visitante, ao cliente e ao prestador, os dados necessários a cada operação e as condições para alterar a situação de uma solicitação. A organização do documento segue o modelo acadêmico institucional.')
p('O escopo inclui cadastro, autenticação, gestão de categorias, pesquisa e acompanhamento de serviços. O catálogo reúne 152 categorias padrão em 12 grupos, com pesquisa por profissões e vínculo de várias áreas ao perfil. A página inicial mostra seis destaques e oferece a lista completa na busca. Pagamento, chat, agenda, fotografias e recuperação por email permanecem como evoluções sem integração nesta versão.')
h('3.1.1 Catálogo de profissões e serviços',3)
p(f'O catálogo padrão contém {TOTAL_CATEGORIAS} categorias em {TOTAL_GRUPOS} grupos. Sua fonte é o arquivo serviceCategories.json. Na inicialização, a API insere apenas categorias ausentes, sem substituir descrições ou vínculos anteriores. As informações de grupo e os termos auxiliares são acrescentados à resposta da API a partir do JSON; não existe uma tabela de grupos no banco.')
table(['Área de atuação','Categorias padrão'],[(grupo['group'],len(grupo['items'])) for grupo in CATALOGO]+[('TOTAL',TOTAL_CATEGORIAS)],'Quadro 2 – Composição do catálogo padrão',widths=[13.7,3.5])
p('No painel, a área “Com o que você trabalha?” permite pesquisar uma profissão, escolher uma categoria existente e vinculá-la ao perfil. A pesquisa desconsidera acentos e utiliza nome, descrição, grupo e termos auxiliares. Assim, jardineiro encontra Jardinagem e eletricista encontra Elétrica. Após cada vínculo, o prestador pode selecionar outra área; categorias já vinculadas deixam de aparecer entre as disponíveis.')
p('Os seis cartões da página inicial são destaques de navegação. A lista completa permanece disponível no filtro de categoria. Categorias anteriores que não integram o arquivo padrão são preservadas e recebem o grupo Outros serviços. Por isso, uma base existente pode conter mais de 152 registros. O formulário “Cadastrar nova categoria” foi retirado do painel; a versão mantém uma rota de criação na API por compatibilidade, sem disponibilizar essa operação na interface atual.')
h('3.2 Requisitos',2)
h('3.2.1 Requisitos funcionais',3)
rf=[
('RF01','Cadastrar cliente ou prestador, validando nome, email, senha e tipo de conta.'),
('RF02','Impedir duplicação de email e guardar somente o hash da senha.'),
('RF03','Criar o perfil profissional junto ao cadastro de prestador.'),
('RF04','Autenticar por email e senha, emitir JWT e consultar a sessão ativa.'),
('RF05','Proteger o painel e permitir sair da sessão do navegador.'),
('RF06','Listar categorias e profissionais ativos publicamente.'),
('RF07','Buscar profissionais por texto, termos de profissões, cidade e categoria ativa, sem distinção de acentos.'),
('RF08','Exibir perfil público com localização, preço inicial, categorias e avaliações.'),
('RF09','Permitir ao prestador editar telefone, cidade, UF, descrição e preço inicial.'),
('RF10','Vincular categorias existentes ao próprio perfil e ativar ou desativar cada vínculo.'),
('RF11','Permitir ao cliente solicitar serviço de uma categoria ativa do prestador.'),
('RF12','Listar somente pedidos em que o usuário é cliente ou prestador.'),
('RF13','Permitir ao prestador enviar orçamento positivo ou recusar pedido pendente.'),
('RF14','Permitir ao cliente aceitar, recusar ou cancelar um pedido orçado e cancelar um pedido pendente.'),
('RF15','Exibir telefone profissional ao cliente após o aceite e após a conclusão.'),
('RF16','Permitir ao prestador concluir serviço aceito.'),
('RF17','Permitir uma avaliação de 1 a 5 somente pelo cliente do serviço concluído.'),
('RF18','Calcular avaliação pública a partir das avaliações vinculadas aos pedidos.'),
('RF19','Filtrar solicitações por situação e atualizar a lista por ação do usuário.'),
('RF20','Disponibilizar verificação de funcionamento da API com consulta ao banco.'),
('RF21','Disponibilizar 152 categorias padrão em 12 grupos e complementar o banco sem duplicar ou apagar registros anteriores.'),
('RF22','Agrupar a lista completa de categorias por área na busca pública e na seleção do prestador.'),
('RF23','Pesquisar profissões no painel por nome, descrição, grupo e termos auxiliares; permitir múltiplas áreas por perfil.'),
('RF24','Exibir seis categorias em destaque na página inicial e oferecer acesso à lista completa.'),
('RF25','Apresentar no painel a seleção de categorias existentes, sem formulário para criar categorias.')]
table(['REQ','Descrição implementada'],rf,'Quadro 2 – Requisitos funcionais')
h('3.2.2 Requisitos não funcionais',3)
rnf=[('RNF01','Manter cores, tipografia, cartões e estados consistentes entre as telas, com adaptação para celular e computador.'),('RNF02','Usar React/Vite, Node.js/Express e SQLite, mantendo uma estrutura acessível ao estudo.'),('RNF03','Validar dados na API, usar SQL parametrizado e respostas de erro controladas.'),('RNF04','Verificar token, conta ativa, papel, participantes e transições permitidas.'),('RNF05','Usar transações nas operações compostas e comparar o estado na atualização.'),('RNF06','Manter configurações em variáveis de ambiente e não versionar segredos.'),('RNF07','Limitar o JSON a 32 kB e o conjunto de tentativas de cadastro/login a 50 por IP em 15 minutos.'),('RNF08','Apresentar estados de espera, mensagens de erro, rótulos de formulário e alternativa de nova tentativa.'),('RNF09','Preservar registros existentes por migração aditiva e inicialização repetível do catálogo.'),('RNF10','Possuir testes reproduzíveis com bancos temporários e evidências documentadas.'),('RNF11','Usar ícones SVG locais e estilos compartilhados, sem exigir serviço externo para compor o visual.'),('RNF12','Conferir ausência de rolagem horizontal nas telas e larguras cobertas pelos testes de interface.')]
table(['REQ','Critério'],rnf,'Quadro 3 – Requisitos não funcionais')
h('3.3 Metodologia de desenvolvimento',2)
p('O desenvolvimento foi organizado em incrementos verificáveis: persistência de pedidos e avaliações; rotas e autorização; integração dos formulários; tratamento de falhas; testes e documentação. A base original foi copiada para uma pasta de backup antes das alterações. As dependências foram atualizadas dentro da estrutura existente; a biblioteca sqlite3 passou à versão 6, mantendo sua API de consultas utilizada no projeto.')
p('A interpretação dos estados foi expressa em um conjunto curto de transições. A API valida essa sequência, sem depender somente dos botões visíveis. Operações concorrentes incluem o estado anterior na condição do UPDATE: se outra requisição já o alterou, a API devolve conflito. O valor contratado é guardado em centavos inteiros.')
h('3.4 Casos de uso',2)
p('O visitante consulta categorias e perfis e pode criar uma conta ou entrar. O cliente solicita e decide sobre orçamentos, acompanha seus pedidos e avalia serviços concluídos. O prestador mantém o perfil e as categorias, responde a solicitações e registra a conclusão. Ambos acessam apenas solicitações em que participam.')
figure('Casos de uso do To Work',ASSETS/'casos_uso.png',max_height=16)
table(['Caso','Condição e resultado'],[('Solicitar serviço','Cliente autenticado escolhe categoria ativa, informa necessidade e cidade; a solicitação nasce PENDENTE.'),('Responder orçamento','Prestador do pedido pendente informa valor; situação muda para ORCADO.'),('Aceitar orçamento','Cliente do pedido orçado confirma; situação muda para ACEITO e telefone fica disponível.'),('Concluir serviço','Prestador do pedido aceito registra conclusão; situação muda para CONCLUIDO.'),('Avaliar serviço','Cliente do pedido concluído envia nota de 1 a 5; o vínculo único impede nova avaliação.')], 'Quadro 4 – Descrição dos principais casos de uso')
h('3.5 Diagrama de Entidade e Relacionamento',2)
p('O banco contém seis tabelas. users armazena as contas. provider_profiles acrescenta os dados dos prestadores. categories organiza os serviços e provider_categories mantém a associação muitos para muitos. service_requests registra cliente, prestador, categoria, necessidade, situação e orçamento. reviews guarda no máximo uma avaliação por pedido.')
figure('DER resumido do banco de dados',ASSETS/'der.png',max_height=17)
p('As chaves estrangeiras preservam os relacionamentos. O par prestador/categoria é único, assim como o email e o vínculo entre avaliação e pedido. As colunas legadas de nota e verificação permanecem no perfil para preservar a estrutura anterior, mas a nota pública atual é calculada por consultas às avaliações reais. O desenho é resumido; backend/schema.sql contém os campos e restrições completos.')
h('3.6 Arquitetura de software',2)
p('A interface é executada no navegador. O Axios centraliza o endereço da API, adiciona o token e limita o tempo de espera das chamadas. O Express distribui requisições para rotas de autenticação, vitrine, perfil e solicitações. O middleware de autenticação verifica a assinatura e a validade do JWT e consulta se a conta permanece ativa. As consultas ao SQLite utilizam parâmetros para os valores recebidos.')
figure('Arquitetura da aplicação',ASSETS/'arquitetura.png',max_height=9)
p('O módulo database.js concentra abertura, consultas, inicialização e transações. Em uma operação composta, a conexão exclusiva executa BEGIN IMMEDIATE, realiza as gravações e confirma com COMMIT; uma falha leva a ROLLBACK. Essa organização mantém a lógica de persistência identificável sem acrescentar um framework de banco de dados.')
p('O catálogo JSON contém agrupamentos e descrições, enquanto SQLite mantém os identificadores e os vínculos utilizados nas solicitações. O componente CategoryOptions agrupa as opções recebidas da API em listas nativas do navegador. O compartilhamento de estilos e dos componentes de navegação, autenticação e ícones mantém o desenho consistente sem alterar essa separação de responsabilidades.')
h('3.7 Fluxogramas e situações do serviço',2)
figure('Fluxo de cadastro e autenticação',ASSETS/'autenticacao.png',max_height=15)
figure('Situações e transições de uma solicitação',ASSETS/'estados.png',max_height=12)
figure('Pesquisa e vínculo de profissões no painel',ASSETS/'catalogo.png',max_height=12)
table(['Situação atual','Responsável','Próximas situações'],[('PENDENTE','Prestador','ORCADO ou RECUSADO'),('PENDENTE','Cliente','CANCELADO'),('ORCADO','Cliente','ACEITO, RECUSADO ou CANCELADO'),('ACEITO','Prestador','CONCLUIDO'),('CONCLUIDO / RECUSADO / CANCELADO','—','Sem novas transições; concluído permite avaliação única')], 'Quadro 5 – Regras de transição')
h('3.8 Acompanhamento das atividades',2)
table(['Etapa','Data de consolidação','Situação'],[('Análise de requisitos e organização do código','30/10/2026','Concluída'),('Implementação incremental dos fluxos','30/10/2026','Concluída'),('Testes de API e navegador','30/10/2026','Concluída'),('Medição local e conferência de migração','30/10/2026','Concluída'),('Documentação e roteiro de demonstração','30/10/2026','Concluída'),('Apresentação e avaliação acadêmica','A definir','Pendente'),('Publicação e integrações futuras','A definir','Fora do escopo atual')], 'Quadro 6 – Acompanhamento das atividades')
p('As datas indicam a consolidação das atividades da versão documentada. A apresentação e a avaliação acadêmica seguem o calendário da instituição.')

h('4 RESULTADOS E DISCUSSÕES')
h('4.1 Telas da versão implementada',2)
p('As telas foram capturadas durante testes com usuários fictícios, em banco temporário. Após a implementação funcional, a interface recebeu uma revisão visual: azul-violeta, detalhes em amarelo, busca em faixa horizontal, ícones locais em SVG e cartões de profissionais com hierarquia de informações. Login, cadastro, perfil e painel compartilham cores e espaçamentos. O layout se adapta a celular e computador, mantendo os fluxos de pesquisa, orçamento e avaliação.')
screens=[('Página inicial com busca funcional','01-inicio.png'),('Cadastro de cliente ou prestador','02-cadastro.png'),('Autenticação de usuário','03-login.png'),('Painel do prestador e edição de perfil','04-painel-prestador.png'),('Seleção de profissão e categorias existentes','09-profissoes.png'),('Perfil público e solicitação de serviço','05-solicitacao.png'),('Orçamento recebido pelo cliente','06-orcamento.png'),('Serviço concluído e avaliação registrada','07-avaliacao.png'),('Página inicial em largura de celular','08-celular.png')]
for name, filename in screens:
    if filename != '07-avaliacao.png': page()
    figure(name,DOCS/'evidencias'/filename,'Captura da aplicação executada em teste de navegador, com dados fictícios (2026).',max_height=18)
    if filename == '06-orcamento.png': p('O cliente pode aceitar ou recusar o orçamento recebido. Cancelar também é permitido enquanto o pedido não foi aceito. O valor informado no pedido é mantido em centavos inteiros no banco.')
h('4.2 Testes de software',2)
p('A validação foi executada com oito testes automatizados de API e quatro testes de navegador. Os testes da API utilizam o executor nativo do Node.js e exercitam requisições HTTP contra um servidor com banco temporário. Os testes de interface utilizam Playwright e portas separadas, simulando cliente e prestador em sessões independentes.')
api_tests=[('T01','Catálogo de 152 categorias, grupos e termos; inicialização repetida; migração e perfis antigos','Aprovado'),('T02','Cadastro, tipos, email, limite de senha, hash, login e expiração do JWT','Aprovado'),('T03','Perfil, busca sem acentos e por profissão, categoria inativa e privacidade pública','Aprovado'),('T04','Pedido, orçamento, aceite, conclusão e avaliação única','Aprovado'),('T05','Acesso a pedidos de terceiros, papéis e bloqueio de estados finais','Aprovado'),('T06','Decisões concorrentes: somente uma transição é aplicada','Aprovado'),('T07','Rollback após falha em operação composta','Aprovado'),('T08','Conta inativa e resposta controlada a JSON inválido','Aprovado'),('N01','Fluxo entre duas contas; pesquisa jardineiro; lista com 12 grupos; vínculo de várias áreas; reload e login','Aprovado'),('N02','Rota protegida, senha incorreta e token inválido','Aprovado'),('N03','Erro de rede e recuperação da pesquisa','Aprovado'),('N04','Busca vazia, limpeza, papel predefinido no cadastro, endereços e larguras de 320, 390, 768 e 1366 pixels','Aprovado')]
table(['Teste','Cenário executado','Resultado'],api_tests,'Quadro 7 – Testes automatizados executados')
p('Além dos testes, o comando de build concluiu a geração da interface, e npm audit não apontou vulnerabilidades conhecidas nos conjuntos de dependências da raiz, API e interface na data da revisão. Esse resultado não corresponde a uma auditoria completa de segurança. A medição local está descrita na seção 2.2.2 e pode variar a cada execução.')
migration=json.loads((DOCS/'evidencias/migracao.json').read_text(encoding='utf8'))
p('A compatibilidade com a base existente foi conferida em uma cópia consistente do arquivo local. Todos os registros anteriores foram comparados campo a campo após a inicialização. A verificação de integridade retornou ok e não foram encontrados erros de chaves estrangeiras. O banco original não foi usado pelos testes.')
table(['Tabela','Antes','Após inicialização','Registros existentes'],[(t['table'],t['before'],t['after'],'Preservados') for t in migration['tables']], 'Quadro 8 – Migração verificada em cópia do banco local')
p('As evidências ficam em docs/evidencias: capturas da interface, benchmark.json e migracao.json. O relatório de validação descreve os comandos. Os resultados se referem aos cenários executados em Windows com navegador Chromium; não houve teste com usuários externos nem teste de carga concorrente em produção.')
h('4.3 Riscos identificados',2)
table(['Risco ou limite','Impacto','Tratamento atual / evolução'],[('Token no localStorage','Scripts executados na origem podem acessar o token.','React renderiza texto sem HTML bruto; considerar cookies HttpOnly, política de conteúdo e revisão antes de publicar.'),('Logout sem revogação no servidor','Um token copiado continua válido até expirar.','Expiração de sete dias e verificação de conta ativa; implementar revogação em evolução.'),('SQLite e pesquisa em memória','Maior carga pode exigir paginação e outro desenho de acesso.','Medição local registrada; paginar e avaliar carga antes de escalar.'),('Confirmação unilateral de conclusão','O registro do prestador não prova execução presencial.','Limitação explícita; prever confirmação do cliente e tratamento de disputas.'),('Ausência de email e moderação','Não há recuperação de senha ou verificação documental.','Não anunciar esses recursos; planejar serviço de email e governança.'),('Sem pagamento integrado','O orçamento não realiza cobrança.','Pagamento é negociado fora da aplicação; integração futura.'),('Configuração e publicação','Origem ou segredo incorreto impede acesso ou reduz proteção.','Exemplos de ambiente, falha de configuração em produção e orientação de HTTPS.'),('Dependências e dados locais','Atualizações podem introduzir mudanças; arquivo local exige cópia de segurança.','Lockfiles, testes após atualização e planejamento de backup.')], 'Quadro 9 – Riscos e limites')
h('4.4 Discussão dos resultados',2)
p('A evolução principal foi transformar uma vitrine com autenticação em um percurso de atendimento demonstrável. O cliente pesquisa, descreve a necessidade e acompanha a resposta. O prestador recebe o pedido e registra um valor. O aceite libera o contato profissional para o participante, e a avaliação depende de um serviço concluído. Dessa forma, as notas deixam de depender de valores previamente preenchidos no perfil.')
p('O desenho mantém funções e arquivos diretamente associados às responsabilidades do sistema. Não foram introduzidos microsserviços, filas ou novos frameworks de interface. Essa escolha favorece a explicação acadêmica e não implica que a estrutura seja a melhor solução para qualquer volume de uso. A busca em memória e a atualização manual das listas são compromissos conscientes da versão.')
p('Os testes demonstraram o comportamento dos cenários selecionados e verificaram bloqueios que a interface sozinha não poderia garantir. A ausência de falhas nesses testes não prova ausência total de defeitos. A validação futura com pessoas reais, outros navegadores e condições de rede variadas poderá revelar necessidades que não aparecem na execução automatizada local.')

h('5 PERSPECTIVAS FUTURAS')
p('As próximas melhorias devem priorizar uso real e segurança antes de aumentar a complexidade: recuperação de senha com email verificado, revisão do armazenamento e da revogação de sessão, consentimento e gestão de dados pessoais, backup e monitoramento. A publicação exigirá HTTPS e revisão específica das configurações do ambiente.')
p('No fluxo de atendimento, há espaço para confirmação de conclusão pelo cliente, agenda, cancelamento após aceite com regras de acordo, mensagens entre participantes, upload de fotografias e moderação. Pagamentos demandam provedor externo, regras de cobrança e tratamento de estorno. Tais recursos não estão disponíveis na versão descrita.')
p('Caso a base cresça, recomenda-se medir consultas e volume antes de modificar a arquitetura. Paginação, filtragem no banco e índices orientados pelas consultas podem ser etapas anteriores à migração para um banco cliente-servidor. Nenhuma decisão de expansão depende de adotar tecnologias complexas apenas por tendência.')
page(); h('6 CONSIDERAÇÕES FINAIS')
p('O To Work implementa o ciclo acadêmico de conexão entre cliente e prestador com uma interface renovada e as tecnologias da base. Busca, catálogo de 152 categorias, perfil editável, solicitações, orçamento, aceite, conclusão e avaliação compõem um fluxo integrado, sustentado por regras explícitas de autorização e situação. A organização em 12 áreas e a pesquisa por profissão ampliam as possibilidades de atuação sem exigir novas tabelas de cadastro.')
p('O trabalho também produziu documentação, diagramas, capturas e orientações de execução e apresentação. O resultado permite demonstrar conceitos de interface, API, banco relacional, autenticação e testes com uma estrutura organizada para compreensão e manutenção. As verificações realizadas aprovam os cenários documentados e delimitam as funcionalidades que permanecem futuras.')
p('A contribuição se concentra em tornar a proposta executável e explicável, sem apresentar a versão acadêmica como um serviço já preparado para operação pública em larga escala. A validação com usuários e a preparação de publicação constituem os próximos passos naturais do projeto.')

page(); h('REFERÊNCIAS BIBLIOGRÁFICAS')
references=[
('AUTH0','node-jsonwebtoken: documentação do projeto','https://github.com/auth0/node-jsonwebtoken'),
('BCRYPT.JS','bcrypt.js: documentação do projeto','https://github.com/dcodeIO/bcrypt.js'),
('EXPRESS','Production best practices: security','https://expressjs.com/en/advanced/best-practice-security/'),
('GOOGLE','Google Engineering Practices: what to look for in a code review','https://google.github.io/eng-practices/review/reviewer/looking-for.html'),
('REACT','Quick Start','https://react.dev/learn'),
('SQLITE','Appropriate uses for SQLite [2026a]','https://www.sqlite.org/whentouse.html'),
('SQLITE','Transaction [2026b]','https://www.sqlite.org/lang_transaction.html'),
('VITE','Getting started','https://vite.dev/guide/')]
for author,name,url in references:
    para=p(f'{author}. {name}. Documentação eletrônica. Disponível em: {url}. Acesso em: 30 out. 2026.',False)
    para.paragraph_format.line_spacing=1
p('UNIFASIPE. Modelo de documentação de Projeto Interdisciplinar. Sinop-MT, [s.d.].',False)
p('TO WORK. Código-fonte, testes e evidências da revisão de 30 de outubro de 2026. Material do projeto, 2026.',False)

page(); h('APÊNDICE A – EXECUÇÃO E DEMONSTRAÇÃO')
h('A.1 Preparação local',2)
p('A execução foi verificada no Windows com Node.js 24.16.0 e npm. Na pasta que contém package.json, backend e frontend, os comandos abaixo instalam as dependências e iniciam a API e a interface. Uma conexão com a internet é necessária para baixar os pacotes; o fluxo principal da aplicação não depende de serviço externo após a instalação.')
for comando in ['npm install','npm run setup','npm run dev']:
    para=p(comando,False); para.paragraph_format.line_spacing=1
    for run in para.runs: run.font.name='Consolas'; run.font.size=Pt(10)
p('A interface abre em http://localhost:5173 e a API responde em http://localhost:3001/api/health. O comando Ctrl+C encerra os processos iniciados no terminal. As portas devem estar livres. Em um computador com a cópia completa da pasta de trabalho, o arquivo INICIAR_TO_WORK.bat também executa o inicializador do projeto.')
p('As variáveis de ambiente são documentadas nos arquivos .env.example. DATABASE_FILE define o arquivo SQLite; FRONTEND_URL define a origem permitida; PORT define a porta da API e VITE_API_URL define o endereço usado pela interface. JWT_SECRET deve ser uma chave pessoal e não deve ser publicado. Sem essa variável, o desenvolvimento utiliza uma chave temporária; reiniciar a API encerra a validade das sessões emitidas com essa chave. Em produção, o código exige ao menos 32 caracteres no segredo.')
h('A.2 Roteiro de demonstração',2)
for numero,text in enumerate([
'Cadastre um prestador e preencha cidade, UF, descrição e telefone no perfil profissional.',
'Em Com o que você trabalha?, digite jardineiro, escolha Jardinagem e clique em Vincular categoria. Repita com Elétrica para demonstrar várias áreas no mesmo perfil.',
'Abra uma janela anônima e cadastre um cliente. Use sessões separadas, pois abas do mesmo navegador compartilham o login.',
'No cliente, pesquise o serviço, selecione a cidade ou a categoria e abra o perfil do prestador.',
'Envie uma solicitação com categoria, título, descrição da necessidade e cidade.',
'No prestador, atualize a lista de solicitações e envie um orçamento com o valor combinado.',
'No cliente, atualize a lista e aceite o orçamento. O telefone do prestador passa a ficar disponível nesse pedido.',
'No prestador, atualize a lista e registre a conclusão. No cliente, atualize e envie uma avaliação.',
'Consulte o perfil público para mostrar a nota recebida e recarregue a página para demonstrar a persistência.'
],1): p(f'{numero}. {text}',False)
p('As solicitações são atualizadas pelo botão Atualizar solicitações. A versão não possui atualização em tempo real. No painel, ativar e desativar uma categoria controla sua disponibilidade pública sem apagar o vínculo nem os pedidos anteriores.')
h('A.3 Verificação e estudo',2)
p('Os comandos npm test, npm run build e npm run test:e2e repetem as verificações principais. Para o navegador, instale antes o Chromium com npx playwright install chromium. Os testes usam bancos temporários e as portas 3107 e 5187, preservando o arquivo de dados da utilização normal.')
p('Para explicar a implementação, estude App.jsx e AuthContext.jsx na interface; authRoutes.js e authMiddleware.js para autenticação; requestRoutes.js para as decisões sobre pedidos; database.js e schema.sql para persistência; serviceCategories.json e CategoryOptions.jsx para o catálogo. O guia GUIA_APRESENTACAO.md complementa o roteiro com perguntas e respostas em linguagem simples.')

page(); h('APÊNDICE B – CATÁLOGO PADRÃO DE SERVIÇOS')
p(f'A relação abaixo foi gerada diretamente do arquivo serviceCategories.json da versão documentada. São {TOTAL_CATEGORIAS} categorias em {TOTAL_GRUPOS} grupos. Os grupos organizam a navegação; a disponibilidade de cada serviço depende dos vínculos ativos dos prestadores. Categorias personalizadas herdadas de versões anteriores não fazem parte desta relação padrão.')
table(['Área de atuação','Categorias incluídas'],[(grupo['group'],'; '.join(item[0] for item in grupo['items'])+'.') for grupo in CATALOGO],'Quadro 11 – Relação completa do catálogo padrão',widths=[4.5,12.7])

doc.core_properties.title='To Work: plataforma web para conexão entre clientes e prestadores de serviços'
doc.core_properties.author='Rychard Vinicios Fondelis da Silva; Gabriel Luiz de Oliveira'
doc.core_properties.subject='Projeto Interdisciplinar — documentação da versão funcional'
doc.core_properties.comments=''
doc.core_properties.last_modified_by=doc.core_properties.author
doc.core_properties.keywords='To Work; prestação de serviços; desenvolvimento web'
doc.save(DOCS/'Documentacao_To_Work_Atualizada.docx')
fontes={}
for pasta in [REPO/'backend/src',REPO/'frontend/src']:
    for arquivo in sorted(pasta.rglob('*')):
        if arquivo.is_file(): fontes[arquivo.relative_to(REPO).as_posix()]=hashlib.sha256(arquivo.read_bytes()).hexdigest()
fontes['backend/schema.sql']=hashlib.sha256((REPO/'backend/schema.sql').read_bytes()).hexdigest()
estrutura={'date':'2026-10-30','functionalRequirements':len(rf),'nonFunctionalRequirements':len(rnf),'figures':len(figures),'tables':len(quadros),'standardCategories':TOTAL_CATEGORIAS,'categoryGroups':TOTAL_GRUPOS,'sourceSha256':fontes}
(DOCS/'evidencias/estrutura_documentacao.json').write_text(json.dumps(estrutura,indent=2,ensure_ascii=False),encoding='utf8')
print('DOCX gerado:',DOCS/'Documentacao_To_Work_Atualizada.docx')
print('Figuras:',len(figures))
print('Quadros:',len(quadros))
