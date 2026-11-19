import { prisma } from '../config/database';
import { buildRequestSearchIndex } from '../utils/search';
import { hashPassword } from '../utils/password';

const CATALOG: Record<string, Array<{ name: string; price: number; quantity: number }>> = {
  LADA: [
    { name: 'Vesta', price: 2000, quantity: 4 },
    { name: 'Granta', price: 1500, quantity: 6 },
    { name: 'Niva Travel', price: 2200, quantity: 2 },
  ],
  Toyota: [
    { name: 'Camry', price: 3500, quantity: 3 },
    { name: 'Corolla', price: 2800, quantity: 5 },
    { name: 'RAV4', price: 3800, quantity: 4 },
  ],
  BMW: [
    { name: '3 серии', price: 5500, quantity: 2 },
    { name: '5 серии', price: 7000, quantity: 2 },
    { name: 'X5', price: 8500, quantity: 1 },
  ],
  Kia: [
    { name: 'Rio', price: 1800, quantity: 5 },
    { name: 'Sportage', price: 3400, quantity: 3 },
    { name: 'K5', price: 3200, quantity: 2 },
  ],
};

async function seedCatalog() {
  for (const [brandName, models] of Object.entries(CATALOG)) {
    const brand = await prisma.carBrand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });

    for (const model of models) {
      await prisma.carModel.upsert({
        where: { brandId_name: { brandId: brand.id, name: model.name } },
        update: { price: model.price, quantity: model.quantity },
        create: {
          brandId: brand.id,
          name: model.name,
          price: model.price,
          quantity: model.quantity,
        },
      });
    }
  }
}

async function seedUsers() {
  const admin = await prisma.user.upsert({
    where: { login: 'avto2024' },
    update: {
      passwordHash: hashPassword('poehali'),
      role: 'ADMIN',
      fullName: 'Администратор портала',
      phone: '+7(900)-000-00-01',
      email: 'admin@edem.local',
    },
    create: {
      login: 'avto2024',
      passwordHash: hashPassword('poehali'),
      role: 'ADMIN',
      fullName: 'Администратор портала',
      phone: '+7(900)-000-00-01',
      email: 'admin@edem.local',
    },
  });

  const demo = await prisma.user.upsert({
    where: { login: 'демо01' },
    update: {
      passwordHash: hashPassword('demo123'),
      fullName: 'Демо Пользователь',
      phone: '+7(900)-123-45-67',
      email: 'demo@edem.local',
    },
    create: {
      login: 'демо01',
      passwordHash: hashPassword('demo123'),
      fullName: 'Демо Пользователь',
      phone: '+7(900)-123-45-67',
      email: 'demo@edem.local',
    },
  });

  return { admin, demo };
}

function at(offsetDays: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function seedRequests(demoUserId: number) {
  const total = await prisma.testDriveRequest.count();
  if (total > 0) return;

  const models = await prisma.carModel.findMany({
    include: { brand: true },
  });
  const findModel = (brand: string, model: string) => {
    const found = models.find((item) => item.brand.name === brand && item.name === model);
    if (!found) throw new Error(`Не найдена модель ${brand} ${model}`);
    return found;
  };

  const demo = {
    fullName: 'Демо Пользователь',
    login: 'демо01',
    phone: '+7(900)-123-45-67',
    email: 'demo@edem.local',
    address: 'г. Москва, ул. Тверская, д. 12, кв. 5',
  };

  const rows = [
    { brand: 'LADA', model: 'Vesta', offset: 1, hour: 11, status: 'PENDING', payment: 'CASH' },
    { brand: 'Toyota', model: 'Camry', offset: 3, hour: 15, status: 'APPROVED', payment: 'CARD' },
    { brand: 'BMW', model: 'X5', offset: -5, hour: 12, status: 'COMPLETED', payment: 'CARD' },
    {
      brand: 'Kia',
      model: 'Sportage',
      offset: 6,
      hour: 10,
      status: 'REJECTED',
      payment: 'CASH',
      reason: 'В выбранную дату автомобиль занят на другом тест-драйве.',
    },
    { brand: 'LADA', model: 'Granta', offset: 8, hour: 9, status: 'PENDING', payment: 'CASH' },
    { brand: 'Toyota', model: 'RAV4', offset: 10, hour: 17, status: 'APPROVED', payment: 'CARD' },
    { brand: 'BMW', model: '3 серии', offset: -12, hour: 14, status: 'COMPLETED', payment: 'CARD' },
    { brand: 'Kia', model: 'Rio', offset: 12, hour: 16, status: 'PENDING', payment: 'CASH' },
  ];

  for (const [index, row] of rows.entries()) {
    const carModel = findModel(row.brand, row.model);
    const createdAt = new Date(Date.now() - (index + 1) * 36e5 * 7);
    await prisma.testDriveRequest.create({
      data: {
        userId: demoUserId,
        carModelId: carModel.id,
        address: demo.address,
        contactPhone: demo.phone,
        scheduledAt: at(row.offset, row.hour, index % 2 === 0 ? 0 : 30),
        licenseSeries: '7712',
        licenseNumber: '345678',
        licenseIssuedAt: new Date('2018-06-14T00:00:00.000Z'),
        paymentType: row.payment,
        status: row.status,
        rejectionReason: row.reason ?? null,
        searchIndex: buildRequestSearchIndex([
          demo.fullName,
          demo.login,
          demo.phone,
          demo.email,
          demo.address,
          row.brand,
          row.model,
        ]),
        createdAt,
      },
    });
  }
}

async function main() {
  await seedCatalog();
  const { demo } = await seedUsers();
  await seedRequests(demo.id);

  const [brands, models, users, requests] = await Promise.all([
    prisma.carBrand.count(),
    prisma.carModel.count(),
    prisma.user.count(),
    prisma.testDriveRequest.count(),
  ]);

  console.log('База данных заполнена:');
  console.log(`  марок: ${brands}, моделей: ${models}, пользователей: ${users}, заявок: ${requests}`);
  console.log('  администратор: avto2024 / poehali');
  console.log('  демо-пользователь: демо01 / demo123');
}

main()
  .catch((error) => {
    console.error('Ошибка заполнения базы данных:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
