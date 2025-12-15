import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===========================================
  // Create Admin User
  // ===========================================
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@belbird.ru' },
    update: {},
    create: {
      email: 'admin@belbird.ru',
      passwordHash: adminPassword,
      fullName: 'Администратор',
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ===========================================
  // Create Categories
  // ===========================================
  const categories = [
    { name: 'Собаки', slug: 'dogs', description: 'Всё для собак' },
    { name: 'Кошки', slug: 'cats', description: 'Всё для кошек' },
    { name: 'Птицы', slug: 'birds', description: 'Всё для птиц' },
    { name: 'Грызуны', slug: 'rodents', description: 'Всё для грызунов' },
    { name: 'Рыбки', slug: 'fish', description: 'Аквариумы и рыбки' },
    { name: 'Сельхоз животные', slug: 'farm', description: 'Для сельскохозяйственных животных' },
    { name: 'Дом', slug: 'home', description: 'Товары для дома' },
    { name: 'Сад', slug: 'garden', description: 'Товары для сада' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created');

  // ===========================================
  // Create Brands
  // ===========================================
  const brands = [
    { name: 'Royal Canin', slug: 'royal-canin' },
    { name: 'Purina', slug: 'purina' },
    { name: 'Whiskas', slug: 'whiskas' },
    { name: 'Pedigree', slug: 'pedigree' },
    { name: 'BelBird', slug: 'belbird' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
  }
  console.log('✅ Brands created');

  // ===========================================
  // Create Sample Products
  // ===========================================
  const dogsCategory = await prisma.category.findUnique({ where: { slug: 'dogs' } });
  const catsCategory = await prisma.category.findUnique({ where: { slug: 'cats' } });
  const royalCanin = await prisma.brand.findUnique({ where: { slug: 'royal-canin' } });

  const products = [
    {
      name: 'Royal Canin Medium Adult',
      slug: 'royal-canin-medium-adult',
      sku: 'RC-MA-15',
      description: 'Полнорационный корм для взрослых собак средних пород. Поддерживает здоровье кожи и блеск шерсти.',
      price: 4990,
      oldPrice: 5490,
      stockCount: 50,
      images: ['/uploads/products/placeholder.jpg'],
      features: ['Для средних пород', 'Поддержка иммунитета', 'Здоровая шерсть'],
      specifications: { weight: '15 кг', 'age': 'от 1 года', 'size': 'Средние породы' },
      categoryId: dogsCategory?.id,
      brandId: royalCanin?.id,
      isActive: true,
      isBestseller: true,
    },
    {
      name: 'Royal Canin Indoor Cat',
      slug: 'royal-canin-indoor-cat',
      sku: 'RC-IC-4',
      description: 'Специальный корм для кошек, живущих в помещении. Контроль веса и здоровье пищеварения.',
      price: 2490,
      stockCount: 100,
      images: ['/uploads/products/placeholder.jpg'],
      features: ['Для домашних кошек', 'Контроль веса', 'Уменьшение запаха'],
      specifications: { weight: '4 кг', 'age': 'от 1 года' },
      categoryId: catsCategory?.id,
      brandId: royalCanin?.id,
      isActive: true,
      isNew: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log('✅ Sample products created');

  // ===========================================
  // Create Site Settings
  // ===========================================
  const settings = [
    { key: 'site_name', value: 'BelBird' },
    { key: 'site_logo', value: '/uploads/site-assets/logo.png' },
    { key: 'contact_phone', value: '+7 (800) 123-45-67' },
    { key: 'contact_email', value: 'info@belbird.ru' },
    { key: 'contact_address', value: 'г. Москва, ул. Примерная, д. 1' },
    { key: 'working_hours', value: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00' },
    { key: 'social_vk', value: 'https://vk.com/belbird' },
    { key: 'social_telegram', value: 'https://t.me/belbird' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log('✅ Site settings created');

  // ===========================================
  // Create Promo Code
  // ===========================================
  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountPercent: 10,
      minOrderAmount: 1000,
      isActive: true,
    },
  });
  console.log('✅ Promo code created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
