export interface CourseGuide {
  eyebrow: string;
  title: string;
  intro: string;
  overview: string[];
  topics: { title: string; text: string }[];
  practice: string[];
  images: { src: string; alt: string; caption: string; source: string }[];
  reference: { title: string; url: string };
}

export const courseGuides: Record<string, CourseGuide> = {
  "general-english": {
    eyebrow: "Mustahkam poydevor",
    title: "Grammatikani tushuning. Fikringizni aniq ifodalang.",
    intro:
      "Ingliz tilidagi gapning qanday tuzilishini anglash — o‘qish, yozish va erkin muloqotga yo‘l ochadi.",
    overview: [
      "Grammatika so‘zlarni ma’noli gapga birlashtirishga yordam beradi. Zamon, so‘z tartibi va yordamchi fe’llarni tushunsangiz, faqat tayyor jumlalarni yodlash bilan cheklanmay, o‘z fikringizni ham tuza boshlaysiz.",
      "Bu yo‘nalish ingliz tilini boshlayotgan, oldin o‘rganganlarini tartibga solmoqchi bo‘lgan yoki keyinchalik IELTS va SEFR tayyorgarligiga o‘tishni rejalashtirgan o‘quvchilar uchun foydali poydevor beradi. Mavzuni misolda ko‘rish, o‘zingiz gap tuzish va xatoni tahlil qilish bir-birini to‘ldiradi.",
    ],
    topics: [
      {
        title: "Gap qurilishi",
        text: "Ega, kesim va to‘ldiruvchi; darak, so‘roq va inkor gaplar. So‘z tartibi o‘zgarganda ma’no qanday o‘zgarishini misollarda ko‘rish.",
      },
      {
        title: "Fe’l zamonlari",
        text: "Hozirgi, o‘tgan va kelasi vaqtni ifodalash. Har bir shaklni alohida yodlashdan tashqari, qaysi vaziyatda ishlatishni tushunish.",
      },
      {
        title: "So‘zlar o‘rtasidagi bog‘lanish",
        text: "Artikl, olmosh, sifat va predloglar. Kundalik mavzularda qisqa va ravon jumlalar tuzish.",
      },
      {
        title: "Grammatika amalda",
        text: "Qisqa matnni o‘qish, savollarga javob berish va kichik yozma ish orqali qoidalarni nutqda qo‘llash.",
      },
    ],
    practice: [
      "Qoidani qisqa misol bilan tushuning.",
      "O‘zingizga tegishli vaziyat haqida gap tuzing.",
      "Xatolarni tekshirib, shu mavzuni keyin yana takrorlang.",
    ],
    images: [
      {
        src: "/courses/grammar-reading.webp",
        alt: "Ochiq kitobdagi matnni ruchka bilan o‘rganish",
        caption: "Qoidani matn ichida ko‘rish",
        source:
          "https://www.pexels.com/photo/a-close-up-shot-of-a-person-holding-a-pen-and-an-open-book-6549352/",
      },
      {
        src: "/courses/grammar-notes.webp",
        alt: "Ochiq kitob, daftar va ruchka bilan mashq qilish uchun joy",
        caption: "Yangi bilimni yozma mashq bilan mustahkamlash",
        source: "https://www.pexels.com/photo/book-and-pen-on-notebook-895465/",
      },
    ],
    reference: {
      title: "British Council: grammatika mashqlari",
      url: "https://learnenglish.britishcouncil.org/free-resources/grammar",
    },
  },
  ielts: {
    eyebrow: "To‘rtta ko‘nikma, bitta maqsad",
    title: "IELTSga ongli va izchil tayyorlaning.",
    intro:
      "Listening, Reading, Writing va Speaking ko‘nikmalarini birgalikda rivojlantirish hamda imtihon topshiriqlarini tushunish.",
    overview: [
      "IELTS ingliz tilidan tinglab tushunish, o‘qish, yozish va gapirishni baholaydi. Tayyorlanishda til bilimini mustahkamlash bilan birga, topshiriq talabini aniq o‘qish va vaqtni to‘g‘ri taqsimlashga e’tibor beriladi.",
      "Academic va General Training yo‘nalishlarida Reading va Writing topshiriqlari farq qiladi. O‘qish, ish yoki boshqa maqsadingizga mos turini aniqlab, tayyorgarlikni shu yo‘nalishda olib borish foydali. Mavjud daraja va mashq natijalari qaysi ko‘nikmaga ko‘proq vaqt ajratishni ko‘rsatadi.",
    ],
    topics: [
      {
        title: "Listening",
        text: "Asosiy fikr va kerakli tafsilotni ajratish, savolni oldindan o‘qish hamda turli nutq namunalarini tinglash.",
      },
      {
        title: "Reading",
        text: "Matndan kerakli ma’lumotni topish, savol va matndagi ma’nodosh ifodalarni anglash, javobni dalil bilan tekshirish.",
      },
      {
        title: "Writing",
        text: "Topshiriqqa mos fikrni rejalash, mantiqiy paragraflar tuzish va yozilgan matnni tekshirish. Academic yo‘nalishida grafik yoki jarayon tavsifi ham o‘rganiladi.",
      },
      {
        title: "Speaking",
        text: "Savolga mavzu doirasida javob berish, fikrni sabab va misollar bilan rivojlantirish, ravonlik hamda tushunarli talaffuz ustida ishlash.",
      },
    ],
    practice: [
      "Avval topshiriqning talabi va formatini aniqlang.",
      "Belgilangan vaqt ichida mustaqil mashq qiling.",
      "Javobdagi xato sababini tahlil qilib, keyingi mashqqa maqsad belgilang.",
    ],
    images: [
      {
        src: "/courses/ielts-listening.webp",
        alt: "Quloqchin bilan kitob va daftar ustida mustaqil ishlayotgan kishi",
        caption: "Tinglash va qayd qilish mashqlari",
        source:
          "https://www.pexels.com/photo/man-wearing-black-crew-neck-t-shirt-using-black-headphones-reading-book-while-sitting-3466163/",
      },
      {
        src: "/courses/ielts-practice.webp",
        alt: "Quloqchin va noutbuk yordamida o‘qiyotgan o‘quvchi",
        caption: "Turli materiallar bilan muntazam tayyorgarlik",
        source:
          "https://www.pexels.com/photo/woman-wearing-blue-headphones-studying-on-her-laptop-7976775/",
      },
    ],
    reference: {
      title: "IELTS: rasmiy imtihon formati",
      url: "https://ielts.org/take-a-test/test-types/ielts-academic-test/",
    },
  },
  cefr: {
    eyebrow: "Darajangizni bosqichma-bosqich rivojlantiring",
    title: "SEFR bilan til bilimingizni tartibga soling.",
    intro:
      "CEFR mezonlari asosida tushunish, yozish va muloqot ko‘nikmalarini rivojlantirishga yo‘naltirilgan tayyorgarlik.",
    overview: [
      "CEFR tilni bilish darajasini A1, A2, B1, B2, C1 va C2 bosqichlari orqali tavsiflaydi. Daraja faqat nechta qoida bilishingizni emas, til yordamida qaysi vazifalarni bajara olishingizni ham ifodalaydi.",
      "SEFR yo‘nalishida kundalik va ta’limga oid vaziyatlarda ma’lumotni tushunish, fikrni yozma ifodalash va suhbatda qatnashish ustida ishlash muhim. Tayyorgarlik maqsadingizga mos imtihonning amaldagi topshiriqlari bilan tanishishdan boshlanadi; mashq mavzulari esa mavjud bilimga qarab tanlanadi.",
    ],
    topics: [
      {
        title: "O‘qib tushunish",
        text: "Matnning asosiy g‘oyasi, tafsilotlari va muallif fikrini anglash. Notanish so‘zning ma’nosini matn yordamida tushunishga harakat qilish.",
      },
      {
        title: "Tinglab tushunish",
        text: "Suhbat va qisqa chiqishlardan muhim ma’lumotni ajratish, eshitilgan fikrni o‘z so‘zlaringiz bilan ifodalash.",
      },
      {
        title: "Yozma ifoda",
        text: "Maqsadga mos matn yozish, fikrlarni mantiqan bog‘lash va kerakli lug‘at hamda grammatikani tanlash.",
      },
      {
        title: "Og‘zaki muloqot",
        text: "Savol berish va javob qaytarish, o‘z nuqtayi nazarini tushuntirish, suhbatni davom ettirish uchun kerakli iboralarni ishlatish.",
      },
    ],
    practice: [
      "Hozir qaysi til vazifalarini mustaqil bajara olishingizni aniqlang.",
      "O‘qish, tinglash, yozish va gapirishga muvozanatli vaqt ajrating.",
      "Yangi vazifa va oldingi ishlaringizni taqqoslab, rivojlanishni kuzating.",
    ],
    images: [
      {
        src: "/courses/cefr-writing.webp",
        alt: "Kitobni o‘qib daftarga qayd qilayotgan kishi",
        caption: "O‘qishdan yozma ifodaga",
        source:
          "https://www.pexels.com/photo/close-up-shot-of-a-person-studying-8553897/",
      },
      {
        src: "/courses/cefr-discussion.webp",
        alt: "Sinfda birgalikda ta’lim olayotgan talabalar",
        caption: "Muloqot va hamkorlikda o‘rganish",
        source:
          "https://www.pexels.com/photo/students-collaborating-in-a-classroom-setting-37810244/",
      },
    ],
    reference: {
      title: "Council of Europe: CEFR darajalari",
      url: "https://www.coe.int/en/web/common-european-framework-reference-languages/introduction-and-context",
    },
  },
};
