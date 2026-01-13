import prisma from './prisma/client';

async function main() {
  console.log('Проверка данных в БД...\n');

  // 1. Проверка пользователей
  const users = await prisma.user.findMany();
  console.log(`Пользователей: ${users.length}`);
  users.forEach((u: any) => console.log(`  - ${u.email} (${u.role})`));

  // 2. Проверка тегов
  const tags = await prisma.tag.findMany();
  console.log(`\nТегов: ${tags.length}`);
  tags.forEach((t: any) => console.log(`  - ${t.name}`));

  // 3. Проверка постов
  const posts = await prisma.post.findMany({
    include: { author: true }
  });
  console.log(`\nПостов: ${posts.length}`);
  posts.forEach((p: any) => console.log(`  - "${p.title}" by ${p.author.name} - published: ${p.published}`));

  // 4. Обновление всех постов на published = true
  console.log('\nОбновление всех постов на published = true...');
  const updated = await prisma.post.updateMany({
    where: { published: false },
    data: { published: true }
  });
  console.log(`Обновлено постов: ${updated.count}`);

  // 5. Создание тестовых тегов если их нет
  const testTags = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Backend', 'Frontend'];
  console.log('\nПроверка тестовых тегов...');
  for (const tagName of testTags) {
    const existing = await prisma.tag.findFirst({ where: { name: tagName } });
    if (!existing) {
      await prisma.tag.create({ data: { name: tagName } });
      console.log(`  Создан тег: ${tagName}`);
    }
  }

  // 6. Итоговая статистика
  console.log('\n=== Итоговая статистика ===');
  const stats = {
    users: await prisma.user.count(),
    posts: await prisma.post.count(),
    publishedPosts: await prisma.post.count({ where: { published: true } }),
    tags: await prisma.tag.count(),
    comments: await prisma.comment.count(),
    likes: await prisma.like.count()
  };
  console.log(stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
