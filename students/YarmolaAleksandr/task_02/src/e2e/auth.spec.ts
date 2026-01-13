import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Общие данные для всех тестов
  const testEmail = `e2e${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'E2E Test User';
  let authToken: string;
  let userData: any;

  test('should complete registration flow', async ({ page, request }) => {
    // Регистрируемся через API
    const response = await request.post('http://localhost:5000/auth/register', {
      data: { email: testEmail, password: testPassword, name: testName }
    });
    expect(response.ok()).toBeTruthy();
    const { token, user } = await response.json();

    // Устанавливаем токен и данные пользователя в localStorage
    await page.goto('/');
    await page.evaluate(({t, u}) => {
      localStorage.setItem('token', t);
      localStorage.setItem('userData', JSON.stringify(u));
    }, { t: token, u: user });
    
    // Перезагружаем страницу чтобы Layout обновился
    await page.reload();
    
    // Проверяем что пользователь залогинен
    await expect(page.locator('button:has-text("Выход")')).toBeVisible();
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('should login with existing credentials', async ({ page, request }) => {
    // Создаем пользователя через API
    const loginEmail = `login${Date.now()}@example.com`;
    await request.post('http://localhost:5000/auth/register', {
      data: { email: loginEmail, password: testPassword, name: testName }
    });
    
    // Логинимся через API
    const loginResponse = await request.post('http://localhost:5000/auth/login', {
      data: { email: loginEmail, password: testPassword }
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { token, user } = await loginResponse.json();
    
    // Устанавливаем токен и данные пользователя в localStorage
    await page.goto('/');
    await page.evaluate(({t, u}) => {
      localStorage.setItem('token', t);
      localStorage.setItem('userData', JSON.stringify(u));
    }, { t: token, u: user });
    
    // Перезагружаем страницу чтобы Layout обновился
    await page.reload();
    
    // Проверка успешного входа
    await expect(page.locator('button:has-text("Выход")')).toBeVisible();
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('should show error with wrong password', async ({ page }) => {
    // Очищаем localStorage перед тестом
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await page.goto('/login');
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Ждем обработки запроса
    await page.waitForTimeout(2000);
    
    // Проверяем что НЕ произошел редирект на главную (должны остаться на /login)
    await expect(page).toHaveURL('/login');
    
    // И проверяем что кнопки Выход нет (не залогинились)
    await expect(page.locator('button:has-text("Выход")')).not.toBeVisible();
  });

  test('should logout successfully', async ({ page, request }) => {
    // Создаем и логиним пользователя через API
    const logoutEmail = `logout${Date.now()}@example.com`;
    await request.post('http://localhost:5000/auth/register', {
      data: { email: logoutEmail, password: testPassword, name: testName }
    });
    
    const loginResponse = await request.post('http://localhost:5000/auth/login', {
      data: { email: logoutEmail, password: testPassword }
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { token, user } = await loginResponse.json();
    
    // Устанавливаем токен и данные пользователя в localStorage
    await page.goto('/');
    await page.evaluate(({t, u}) => {
      localStorage.setItem('token', t);
      localStorage.setItem('userData', JSON.stringify(u));
    }, { t: token, u: user });
    
    // Перезагружаем страницу чтобы Layout обновился
    await page.reload();
    
    // Проверяем что пользователь залогинен
    await expect(page.locator('button:has-text("Выход")')).toBeVisible();
    
    // Выход
    await page.click('button:has-text("Выход")');
    
    // Проверка перенаправления на страницу входа
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});

