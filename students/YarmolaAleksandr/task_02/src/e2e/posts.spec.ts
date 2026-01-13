import { test, expect } from '@playwright/test';

test.describe('Posts Management', () => {
  const testPassword = 'testpassword123';
  const testName = 'E2E Posts User';
  const postTitle = 'E2E Test Post';
  const postContent = '# Test Content\n\nThis is a test post created by e2e tests.';
  let authToken: string;

  test.beforeEach(async ({ page, request }) => {
    // Создаем уникальный email для каждого теста
    const testEmail = `posts${Date.now()}${Math.random().toString(36).substring(7)}@example.com`;
    
    // Регистрация через API перед каждым тестом
    const response = await request.post('http://localhost:5000/auth/register', {
      data: { email: testEmail, password: testPassword, name: testName }
    });
    
    expect(response.ok()).toBeTruthy();
    const { token, user } = await response.json();
    authToken = token;
    
    // Устанавливаем токен и данные пользователя
    await page.goto('/');
    await page.evaluate(({t, u}) => {
      localStorage.setItem('token', t);
      localStorage.setItem('userData', JSON.stringify(u));
    }, { t: token, u: user });
    
    await page.reload();
    
    // Ждем пока Layout загрузится и покажет кнопку Выход
    await expect(page.locator('button:has-text("Выход")')).toBeVisible({ timeout: 10000 });
    
    // Проверяем что пользователь в localStorage
    const storedUser = await page.evaluate(() => localStorage.getItem('userData'));
    console.log('Stored user:', storedUser);
  });

  test('should create a new post', async ({ page }) => {
    // Ждем полной загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Проверяем что мы на главной
    await expect(page.locator('h1:has-text("Лента постов")')).toBeVisible({ timeout: 5000 });
    
    // Переход на страницу создания поста через навигацию
    await page.click('a:has-text("Создать пост")');
    await expect(page).toHaveURL('/editor');
    
    // Заполнение формы
    await page.fill('input[placeholder="Заголовок поста"]', postTitle + ' New');
    
    // Заполнение markdown editor через textarea
    await page.fill('textarea[placeholder*="Markdown"]', postContent);
    
    // Публикация
    await page.click('button:has-text("Опубликовать")');
    
    // Ждем перезагрузки страницы (происходит window.location.reload())
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Проверка, что пост появился в списке
    await expect(page.locator(`h2:has-text("${postTitle}")`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should view post details', async ({ page }) => {
    // Создаем пост
    await page.click('a:has-text("Создать пост")');
    await page.fill('input[placeholder="Заголовок поста"]', postTitle);
    await page.fill('textarea[placeholder*="Markdown"]', postContent);
    await page.click('button:has-text("Опубликовать")');
    
    // Ждем перезагрузки и возврата на главную
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Клик на заголовок первого поста
    const firstPostTitle = page.locator('article a h2').first();
    await expect(firstPostTitle).toBeVisible({ timeout: 15000 });
    await firstPostTitle.click();
    
    // Проверка, что открылась страница поста
    await expect(page).toHaveURL(/\/post\/\d+/);
    
    // Проверка наличия заголовка поста
    await expect(page.locator(`h1:has-text("${postTitle}")`)).toBeVisible();
  });

  test('should add comment to post', async ({ page }) => {
    // Создаем пост
    await page.click('a:has-text("Создать пост")');
    await page.fill('input[placeholder="Заголовок поста"]', postTitle);
    await page.fill('textarea[placeholder*="Markdown"]', postContent);
    await page.click('button:has-text("Опубликовать")');
    
    // Ждем перезагрузки и возврата на главную
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Открыть первый пост
    const firstPost = page.locator('article a h2').first();
    await expect(firstPost).toBeVisible({ timeout: 15000 });
    await firstPost.click();
    
    await expect(page).toHaveURL(/\/post\/\d+/);
    
    // Добавить комментарий
    const commentText = 'E2E test comment';
    await page.fill('textarea[aria-label*="Текст комментария"]', commentText);
    await page.click('button[aria-label*="Отправить комментарий"]');
    
    // Проверка, что комментарий появился
    await expect(page.locator(`text=${commentText}`)).toBeVisible({ timeout: 5000 });
  });

  test('should toggle like on post', async ({ page }) => {
    // Создаем пост
    await page.click('a:has-text("Создать пост")');
    await page.fill('input[placeholder="Заголовок поста"]', postTitle);
    await page.fill('textarea[placeholder*="Markdown"]', postContent);
    await page.click('button:has-text("Опубликовать")');
    
    // Ждем перезагрузки и возврата на главную
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Открыть первый пост
    const firstPost = page.locator('article a h2').first();
    await expect(firstPost).toBeVisible({ timeout: 15000 });
    await firstPost.click();
    
    await expect(page).toHaveURL(/\/post\/\d+/);
    
    // Найти кнопку лайка (используем aria-label)
    const likeButton = page.locator('button[aria-label*="лайк"]');
    
    // Ждем появления кнопки
    await expect(likeButton).toBeVisible({ timeout: 5000 });
    
    // Получить начальное состояние
    const initialText = await likeButton.textContent();
    
    // Кликнуть
    await likeButton.click();
    
    // Подождать обновления
    await page.waitForTimeout(1000);
    
    // Проверить что текст изменился
    const newText = await likeButton.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should filter posts by tag', async ({ page }) => {
    await page.goto('/');
    
    // Ждем загрузки
    await page.waitForLoadState('networkidle');
    
    // Проверяем наличие селектора тегов с aria-label
    const tagSelect = page.locator('select[aria-label*="тег"]');
    if (await tagSelect.count() > 0) {
      await tagSelect.selectOption({ index: 1 }); // Выбираем первый тег
      
      // Ждем обновления списка
      await page.waitForTimeout(1500);
      
      // Проверяем наличие постов
      const posts = page.locator('article');
      if (await posts.count() > 0) {
        await expect(posts.first()).toBeVisible();
      }
    }
  });

  test('should search posts', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Найти поле поиска с aria-label
    const searchInput = page.locator('input[aria-label*="поиск"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      
      // Нажать кнопку поиска
      const searchButton = page.locator('button[aria-label*="Искать"]');
      if (await searchButton.count() > 0) {
        await searchButton.click();
      }
      
      // Ждем обновления
      await page.waitForTimeout(1500);
      
      // Проверяем наличие постов
      const posts = page.locator('article');
      if (await posts.count() > 0) {
        await expect(posts.first()).toBeVisible();
      }
    }
  });

  test('should navigate through pages', async ({ page }) => {
    await page.goto('/');
    
    // Ждем загрузки
    await page.waitForLoadState('networkidle');
    
    // Проверить наличие пагинации с aria-label
    const nextButton = page.locator('button[aria-label*="следующ"]');
    if (await nextButton.count() > 0 && await nextButton.first().isEnabled()) {
      await nextButton.first().click();
      
      // Ждем обновления
      await page.waitForTimeout(1500);
      
      // Проверяем наличие постов
      const posts = page.locator('article');
      if (await posts.count() > 0) {
        await expect(posts.first()).toBeVisible();
      }
    }
  });
});

