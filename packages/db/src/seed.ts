import { prisma, randomCode, randomToken } from './index'

const demo = [
  ['المكتبة', 'The library', 'حيث تصمت الأصوات وتعلو الرفوف. ابحث عني بين الكتب.', 'Where voices fall quiet and shelves rise. Find me among the books.'],
  ['المقصف', 'The cafeteria', 'رائحة القهوة تقودك، لكن الكنز خلف الكوب الأخير.', 'Coffee guides you, but the treasure waits past the last cup.'],
  ['الساحة', 'The courtyard', 'في المكان الذي نلتقي فيه جميعا في الصباح.', 'In the place where we all meet in the morning.'],
  ['المعمل', 'The lab', 'أين تنام الأسطر وتستيقظ عند الطلب.', 'Where lines sleep and wake on command.'],
  ['البوابة', 'The gate', 'أول ما تراه وآخر ما تودعه.', 'The first thing you see and the last you leave.'],
] as const

async function main() {
  const existing = await prisma.route.count()
  if (existing > 0) {
    console.log(`seed: ${existing} routes already present, skipping`)
    return
  }

  for (const [section, count] of [
    ['male', 5],
    ['female', 4],
  ] as const) {
    const route = await prisma.route.create({
      data: { nameAr: 'مسار تجريبي', nameEn: 'Demo trail', section, status: 'open' },
    })
    for (let i = 0; i < count; i++) {
      const [nameAr, nameEn, riddleAr, riddleEn] = demo[i]
      await prisma.poster.create({
        data: {
          routeId: route.id,
          nameAr,
          nameEn,
          riddleAr,
          riddleEn,
          token: randomToken(),
          humanCode: randomCode(6),
          seq: i + 1,
        },
      })
    }
    console.log(`seed: ${section} route ${route.id} with ${count} stops`)
  }

  await prisma.setting.upsert({
    where: { key: 'base_url' },
    create: { key: 'base_url', value: '' },
    update: {},
  })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
