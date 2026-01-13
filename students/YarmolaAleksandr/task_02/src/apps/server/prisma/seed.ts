import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Очистка существующих данных (опционально, раскомментируйте при необходимости)
  // await prisma.like.deleteMany();
  // await prisma.comment.deleteMany();
  // await prisma.postTag.deleteMany();
  // await prisma.post.deleteMany();
  // await prisma.tag.deleteMany();
  // await prisma.user.deleteMany();

  // 1. Создание пользователей
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  const author1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'user',
    },
  });

  const author2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      role: 'user',
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: {
      email: 'reader@example.com',
      password: hashedPassword,
      name: 'Regular Reader',
      role: 'user',
    },
  });

  console.log(`✅ Created ${4} users`);

  // 2. Создание тегов
  console.log('🏷️  Creating tags...');
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology' },
    }),
    prisma.tag.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: { name: 'JavaScript' },
    }),
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React' },
    }),
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript' },
    }),
    prisma.tag.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js' },
    }),
    prisma.tag.upsert({
      where: { name: 'Tutorial' },
      update: {},
      create: { name: 'Tutorial' },
    }),
    prisma.tag.upsert({
      where: { name: 'Best Practices' },
      update: {},
      create: { name: 'Best Practices' },
    }),
    prisma.tag.upsert({
      where: { name: 'Web Development' },
      update: {},
      create: { name: 'Web Development' },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // 3. Создание постов
  console.log('📝 Creating posts...');

  const post1 = await prisma.post.create({
    data: {
      title: 'Getting Started with TypeScript in 2025',
      content: `# Introduction to TypeScript

TypeScript has become the de facto standard for building large-scale JavaScript applications. In this comprehensive guide, we'll explore why TypeScript is essential in modern web development.

## Why TypeScript?

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Autocomplete and intelligent refactoring
3. **Improved Maintainability**: Self-documenting code

## Getting Started

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const createUser = (user: User): void => {
  console.log(\`Creating user: \${user.name}\`);
};
\`\`\`

TypeScript's type system helps prevent common bugs and makes your code more robust.`,
      published: true,
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tags.find(t => t.name === 'TypeScript')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'Tutorial')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'Technology')!.id } } },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Building Modern React Applications',
      content: `# Modern React Development

React continues to evolve, and staying up-to-date with best practices is crucial for building performant applications.

## Key Concepts

### Hooks
React Hooks revolutionized how we write components:
- useState for state management
- useEffect for side effects
- useContext for global state
- Custom hooks for reusable logic

### Performance Optimization
- React.memo for preventing unnecessary re-renders
- useMemo and useCallback for expensive computations
- Code splitting with React.lazy

## Example

\`\`\`jsx
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <div>Loading...</div>;
  
  return <div>{user.name}</div>;
};
\`\`\`

These patterns will help you build scalable React applications.`,
      published: true,
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tags.find(t => t.name === 'React')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'JavaScript')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'Best Practices')!.id } } },
        ],
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Node.js Best Practices for Production',
      content: `# Production-Ready Node.js

Deploying Node.js applications to production requires careful consideration of various factors.

## Security

1. **Use helmet.js** for security headers
2. **Validate all inputs** to prevent injection attacks
3. **Keep dependencies updated** to patch vulnerabilities

## Performance

- Implement caching strategies (Redis)
- Use cluster mode for multi-core systems
- Monitor memory usage and prevent leaks

## Error Handling

\`\`\`javascript
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});
\`\`\`

## Logging

Structured logging is essential for debugging production issues. Use Winston or Pino for structured JSON logs.`,
      published: true,
      authorId: author2.id,
      tags: {
        create: [
          { tag: { connect: { id: tags.find(t => t.name === 'Node.js')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'Best Practices')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'Technology')!.id } } },
        ],
      },
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: 'Full-Stack Development Roadmap',
      content: `# Becoming a Full-Stack Developer

A comprehensive roadmap for aspiring full-stack developers in 2025.

## Frontend Skills

- HTML, CSS, JavaScript fundamentals
- Modern framework (React, Vue, or Angular)
- State management (Redux, Zustand)
- TypeScript for type safety

## Backend Skills

- Server framework (Express, NestJS, Fastify)
- Database design (SQL and NoSQL)
- Authentication and authorization
- RESTful API design

## DevOps Basics

- Docker containerization
- CI/CD pipelines
- Cloud platforms (AWS, GCP, Azure)
- Kubernetes basics

## Soft Skills

Communication, problem-solving, and continuous learning are just as important as technical skills.`,
      published: true,
      authorId: author2.id,
      tags: {
        create: [
          { tag: { connect: { id: tags.find(t => t.name === 'Web Development')!.id } } },
          { tag: { connect: { id: tags.find(t => t.name === 'Tutorial')!.id } } },
        ],
      },
    },
  });

  // Draft post (не опубликован)
  const draftPost = await prisma.post.create({
    data: {
      title: 'Advanced TypeScript Patterns (Draft)',
      content: `# Advanced TypeScript Patterns

This article is still in progress...

## Topics to cover:
- Generics and constraints
- Conditional types
- Mapped types
- Template literal types`,
      published: false,
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tags.find(t => t.name === 'TypeScript')!.id } } },
        ],
      },
    },
  });

  console.log(`✅ Created ${5} posts (4 published, 1 draft)`);

  // 4. Создание комментариев
  console.log('💬 Creating comments...');

  await prisma.comment.createMany({
    data: [
      {
        content: 'Great article! TypeScript has really improved my development workflow.',
        authorId: reader.id,
        postId: post1.id,
      },
      {
        content: 'Could you add more examples on generics? That would be helpful.',
        authorId: author2.id,
        postId: post1.id,
      },
      {
        content: 'Thanks for sharing! The hooks section is very clear.',
        authorId: reader.id,
        postId: post2.id,
      },
      {
        content: 'I would also recommend using React Query for data fetching.',
        authorId: author1.id,
        postId: post2.id,
      },
      {
        content: 'Excellent security tips! Helmet is a must-have.',
        authorId: author1.id,
        postId: post3.id,
      },
      {
        content: 'Very comprehensive roadmap. Bookmarked for future reference!',
        authorId: reader.id,
        postId: post4.id,
      },
    ],
  });

  console.log(`✅ Created ${6} comments`);

  // 5. Создание лайков
  console.log('❤️  Creating likes...');

  await prisma.like.createMany({
    data: [
      { userId: reader.id, postId: post1.id },
      { userId: author2.id, postId: post1.id },
      { userId: admin.id, postId: post1.id },
      { userId: reader.id, postId: post2.id },
      { userId: author2.id, postId: post2.id },
      { userId: reader.id, postId: post3.id },
      { userId: author1.id, postId: post3.id },
      { userId: reader.id, postId: post4.id },
    ],
  });

  console.log(`✅ Created ${8} likes`);

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - 4 users (admin@example.com, john@example.com, jane@example.com, reader@example.com)');
  console.log('  - All passwords: "password123"');
  console.log('  - 8 tags');
  console.log('  - 5 posts (4 published, 1 draft)');
  console.log('  - 6 comments');
  console.log('  - 8 likes');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
