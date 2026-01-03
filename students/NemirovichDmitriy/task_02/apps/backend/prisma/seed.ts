import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Очистка в правильном порядке (учитывая FK)
  await prisma.refreshToken.deleteMany();
  await prisma.tripParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.note.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  // Пользователи
  const adminPassword = await bcrypt.hash("Admin1234", 10);
  const user1Password = await bcrypt.hash("User1234", 10);
  const user2Password = await bcrypt.hash("User2234", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      passwordHash: adminPassword,
      role: "admin"
    }
  });

  const user1 = await prisma.user.create({
    data: {
      email: "user1@example.com",
      username: "alice",
      passwordHash: user1Password,
      role: "user"
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@example.com",
      username: "bob",
      passwordHash: user2Password,
      role: "user"
    }
  });

  // Поездка с участниками
  const trip1 = await prisma.trip.create({
    data: {
      title: "Поездка в Стамбул",
      description: "Уикенд в историческом центре",
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-15"),
      budget: 1200,
      ownerId: user1.id,
      participants: {
        create: [{ userId: user1.id }, { userId: user2.id }]
      }
    }
  });

  await prisma.stop.createMany({
    data: [
      {
        tripId: trip1.id,
        name: "Айя-София",
        address: "Sultan Ahmet, Ayasofya Meydanı, Istanbul",
        latitude: 41.0086,
        longitude: 28.9802,
        order: 0,
        arrivalDate: new Date("2026-02-11T09:00:00Z"),
        departureDate: new Date("2026-02-11T12:00:00Z")
      },
      {
        tripId: trip1.id,
        name: "Гранд базар",
        address: "Beyazıt, Istanbul",
        latitude: 41.0107,
        longitude: 28.9680,
        order: 1,
        arrivalDate: new Date("2026-02-12T10:00:00Z"),
        departureDate: new Date("2026-02-12T14:00:00Z")
      }
    ]
  });

  await prisma.note.createMany({
    data: [
      {
        tripId: trip1.id,
        authorId: user1.id,
        content: "Купить билеты в Айя-Софию заранее"
      },
      {
        tripId: trip1.id,
        authorId: user2.id,
        content: "Найти место для обеда рядом с Гранд базаром"
      }
    ]
  });

  await prisma.expense.createMany({
    data: [
      {
        tripId: trip1.id,
        authorId: user1.id,
        amount: 300,
        category: "tickets",
        description: "Авиабилеты",
        date: new Date("2026-02-05")
      },
      {
        tripId: trip1.id,
        authorId: user2.id,
        amount: 80,
        category: "food",
        description: "Ужин в городе",
        date: new Date("2026-02-11")
      }
    ]
  });

  // Вторая поездка только владельца для проверки прав доступа
  await prisma.trip.create({
    data: {
      title: "Поездка в Сочи",
      description: "Горы и море",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-05"),
      budget: 900,
      ownerId: user2.id,
      participants: {
        create: [{ userId: user2.id }]
      }
    }
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
