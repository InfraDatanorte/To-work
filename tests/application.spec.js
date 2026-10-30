const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const screenshots = path.resolve(__dirname, '../docs/evidencias');
fs.mkdirSync(screenshots, { recursive: true });

async function cadastro(page, name, email, type) {
  await page.goto('/register');
  await page.getByLabel('Nome completo').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByLabel('Tipo de conta').selectOption(type);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
}
async function login(page, email) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
}

test('cliente e prestador concluem o fluxo usando somente a interface', async ({ page, browser }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const stamp = Date.now();
  const email = `maria${stamp}@teste.example`;
  await page.goto('/register');
  await page.screenshot({ path: path.join(screenshots, '02-cadastro.png'), fullPage: true });
  await cadastro(page, 'Maria Serviços', email, 'PRESTADOR');
  await page.getByLabel('Cidade', { exact: true }).fill('Sinop');
  await page.getByLabel('UF', { exact: true }).selectOption('MT');
  await page.getByLabel('Telefone (opcional)').fill('(66) 99999-9999');
  await page.getByLabel('Descrição profissional').fill('Instalações e manutenção elétrica residencial em Sinop.');
  await page.getByLabel('Preço inicial em R$ (opcional)').fill('100');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByText('Perfil atualizado. As informações já estão disponíveis na vitrine.')).toBeVisible();
  await page.getByLabel('Buscar profissão ou serviço').fill('jardineiro');
  await page.getByLabel('Categoria', { exact: true }).selectOption({ label: 'Jardinagem' });
  await page.setViewportSize({ width: 900, height: 900 });
  await page.locator('#meus-servicos').screenshot({ path: path.join(screenshots, '09-profissoes.png') });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole('button', { name: 'Vincular categoria', exact: true }).click();
  await expect(page.locator('.linked-list')).toContainText('Jardinagem');
  await page.getByLabel('Buscar profissão ou serviço').fill('');
  await expect(page.getByLabel('Categoria', { exact: true }).locator('optgroup')).toHaveCount(12);
  await page.getByLabel('Categoria', { exact: true }).selectOption({ label: 'Elétrica' });
  await page.getByRole('button', { name: 'Vincular categoria', exact: true }).click();
  await expect(page.getByText('Categoria vinculada ao seu perfil.')).toBeVisible();
  await page.setViewportSize({ width: 900, height: 900 });
  await page.getByRole('heading', { name: 'Meu perfil profissional' }).locator('..').screenshot({ path: path.join(screenshots, '04-painel-prestador.png') });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({ path: path.join(screenshots, 'novo-painel-desktop.png'), fullPage: true });

  const clientContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const clientPage = await clientContext.newPage();
  clientPage.on('pageerror', (error) => errors.push(error.message));
  const clientEmail = `joao${stamp}@teste.example`;
  await cadastro(clientPage, 'João Cliente', clientEmail, 'CLIENTE');
  await clientPage.goto('/');
  await clientPage.getByLabel('Que serviço você precisa?').fill('eletrica');
  await clientPage.getByLabel('Cidade', { exact: true }).fill('Sinop');
  await clientPage.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(clientPage.getByRole('link', { name: 'Ver perfil de Maria Serviços' })).toBeVisible();
  await clientPage.screenshot({ path: path.join(screenshots, '01-inicio.png') });
  await clientPage.getByRole('link', { name: 'Ver perfil de Maria Serviços' }).click();
  await clientPage.getByLabel('Título da solicitação').fill('Trocar tomada da cozinha');
  await clientPage.getByLabel('Descreva o que você precisa').fill('A tomada está sem energia e precisa de reparo.');
  await clientPage.getByLabel('Cidade do atendimento').fill('Sinop');
  await clientPage.screenshot({ path: path.join(screenshots, '05-solicitacao.png'), fullPage: true });
  await clientPage.getByRole('button', { name: 'Enviar solicitação' }).click();
  await expect(clientPage.getByRole('heading', { name: 'Trocar tomada da cozinha' })).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar solicitações' }).click();
  await page.getByLabel('Valor do orçamento em R$').fill('150.50');
  await page.getByLabel('Detalhes do orçamento (opcional)').fill('Mão de obra e materiais incluídos.');
  await page.getByRole('button', { name: 'Enviar orçamento' }).click();
  await expect(page.getByText('Solicitação atualizada.', { exact: true })).toBeVisible();
  await clientPage.getByRole('button', { name: 'Atualizar solicitações' }).click();
  await expect(clientPage.getByText(/Orçamento: R\$/)).toContainText('150,50');
  await clientPage.setViewportSize({ width: 800, height: 900 });
  await clientPage.locator('.request-card').screenshot({ path: path.join(screenshots, '06-orcamento.png') });
  await clientPage.setViewportSize({ width: 1366, height: 900 });
  await clientPage.getByRole('button', { name: 'Aceitar orçamento' }).click();
  await expect(clientPage.getByText('Telefone do prestador:')).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar solicitações' }).click();
  await page.getByRole('button', { name: 'Concluir serviço' }).click();
  await expect(page.getByText('Solicitação atualizada.', { exact: true })).toBeVisible();
  await clientPage.getByRole('button', { name: 'Atualizar solicitações' }).click();
  await clientPage.getByLabel('Nota', { exact: true }).selectOption('5');
  await clientPage.getByLabel('Comentário (opcional)').fill('Ótimo atendimento e serviço concluído.');
  await clientPage.getByRole('button', { name: 'Enviar avaliação' }).click();
  await expect(clientPage.getByText('Avaliação: 5 / 5')).toBeVisible();
  await expect(clientPage.getByRole('button', { name: 'Enviar avaliação' })).toHaveCount(0);
  await clientPage.setViewportSize({ width: 800, height: 900 });
  await clientPage.locator('.request-card').screenshot({ path: path.join(screenshots, '07-avaliacao.png') });
  await clientPage.setViewportSize({ width: 1366, height: 900 });
  await clientPage.reload();
  await expect(clientPage.getByText('Avaliação: 5 / 5')).toBeVisible();
  await clientPage.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(clientPage).toHaveURL(/login$/);
  await clientPage.screenshot({ path: path.join(screenshots, '03-login.png'), fullPage: true });
  await login(clientPage, clientEmail);
  await expect(clientPage.getByText('Avaliação: 5 / 5')).toBeVisible();
  await clientPage.goto('/');
  await clientPage.getByRole('link', { name: 'Ver perfil de Maria Serviços' }).click();
  await expect(clientPage.getByText('Nota 5 / 5', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await clientContext.close();
});

test('rotas protegidas, senha inválida e sessão expirada', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login$/);
  await page.getByLabel('Email', { exact: true }).fill('inexistente@teste.example');
  await page.getByLabel('Senha', { exact: true }).fill('incorreta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Email ou senha inválidos.');
  await page.evaluate(() => localStorage.setItem('@towork:token', 'token-invalido'));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login$/);
  expect(await page.evaluate(() => localStorage.getItem('@towork:token'))).toBeNull();
});

test('falha de rede apresenta mensagem e permite recuperar a busca', async ({ page }) => {
  await page.route('**/api/professionals*', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os prestadores');
  await page.unroute('**/api/professionals*');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Maria Serviços', exact: true })).toBeVisible();
});

test('busca sem resultado, limpeza dos filtros e layout de celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  await page.getByLabel('Que serviço você precisa?').fill('servico-inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('Nenhum prestador encontrado.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ver perfil de Maria Serviços' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
  await page.screenshot({ path: path.join(screenshots, '08-celular.png') });
  for (const width of [320, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto('/');
  await page.getByRole('link', { name: 'Quero oferecer serviços', exact: true }).first().click();
  await expect(page.getByLabel('Tipo de conta')).toHaveValue('PRESTADOR');
  for (const route of ['/register', '/login']) {
    await page.goto(route);
    for (const width of [320, 390, 768, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(screenshots, 'novo-visual-desktop.png') });
  await page.screenshot({ path: path.join(screenshots, 'novo-visual-completo.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
  await page.screenshot({ path: path.join(screenshots, 'novo-visual-celular.png'), fullPage: true });
  await page.goto('/endereco-inexistente');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
});
