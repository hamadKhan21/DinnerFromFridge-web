/**
 * Seasonal & cultural hub pages (/ramadan, /eid, /desi, /arabic).
 * Pure data + helpers (no DOM) so the bot-HTML middleware can reuse them.
 */
import { filterHub, type CatalogEntry, type HubRule } from './catalogMatch'

export type HubLocale = 'en' | 'ar' | 'es' | 'fr' | 'tr' | 'ur'

export interface HubCopy {
  title: string
  h1: string
  intro: string
  sections: Record<string, { h: string; p: string }>
  tips: string[]
}

export interface HubDef {
  slug: 'ramadan' | 'eid' | 'desi' | 'arabic'
  emoji: string
  keywords: string
  sections: { key: string; rule: HubRule }[]
  copy: Record<HubLocale, HubCopy>
}

const HALAL_EXCLUDE = /\b(wine|beer|rum|sake|brandy|bourbon|whisky|whiskey|mirin)\b/i

const IFTAR: HubRule = {
  tags: ['soup', 'lentils', 'chaat', 'kebab', 'chickpeas'],
  words: ['samosa', 'pakora', 'haleem', 'lentil soup', 'shorba', 'chaat', 'kebab', 'falafel', 'hummus', 'fatteh', 'dahi', 'harira', 'soup', 'biryani', 'kabsa'],
  boost: ['samosa', 'pakora', 'haleem', 'lentil soup', 'chaat', 'harira', 'falafel', 'fatteh'],
}
const SUHOOR: HubRule = {
  tags: ['breakfast', 'eggs'],
  words: ['egg', 'shakshuka', 'omelette', 'bhurji', 'yogurt', 'oats', 'paratha', 'foul', 'ful ', 'labneh'],
  boost: ['shakshuka', 'bhurji', 'omelette', 'oats'],
  maxMinutes: 30,
}
const EID_FEAST: HubRule = {
  words: ['biryani', 'korma', 'nihari', 'haleem', 'pulao', 'kofta', 'mandi', 'kabsa', 'kebab', 'qorma', 'karahi', 'roast lamb'],
  tags: ['lamb', 'mutton', 'goat'],
  boost: ['biryani', 'korma', 'nihari', 'mandi', 'kabsa'],
}
const EID_LEFTOVER: HubRule = {
  words: ['wrap', 'fried rice', 'bowl', 'sandwich', 'shawarma', 'keema', 'paratha', 'pulao', 'kofta'],
  tags: ['bowl', 'wrap', 'sandwich'],
  maxMinutes: 30,
  boost: ['keema', 'shawarma', 'wrap', 'fried rice'],
}
const DESI_MAIN: HubRule = {
  tags: ['indian', 'pakistani', 'bengali', 'bangladeshi', 'hyderabadi', 'karahi', 'sindhi', 'balochi', 'kashmiri', 'afghani', 'awadhi', 'south indian'],
  words: ['karahi', 'biryani', 'dal', 'daal', 'sabzi', 'aloo', 'keema', 'tikka', 'korma', 'nihari', 'paneer', 'chana', 'bhuna', 'pulao'],
  boost: ['karahi', 'biryani', 'daal', 'dal ', 'aloo', 'keema'],
}
const DESI_QUICK: HubRule = { ...DESI_MAIN, maxMinutes: 30, boost: ['bhurji', 'aloo', 'keema', 'dal'] }
const ARABIC_MAIN: HubRule = {
  tags: ['arabic', 'middle eastern', 'levantine', 'lebanese', 'egyptian', 'gulf', 'saudi', 'yemeni', 'palestinian', 'jordanian', 'iraqi', 'moroccan', 'north african'],
  words: ['kabsa', 'mandi', 'shawarma', 'hummus', 'falafel', 'fatteh', 'shakshuka', 'kofta', 'maqluba', 'mujadara', 'tagine', 'harira', 'fattoush', 'tabbouleh'],
  boost: ['kabsa', 'mandi', 'shawarma', 'maqluba', 'fatteh'],
}
const ARABIC_QUICK: HubRule = { ...ARABIC_MAIN, maxMinutes: 30, boost: ['shakshuka', 'hummus', 'falafel', 'shawarma'] }

export const HUBS: HubDef[] = [
  {
    slug: 'ramadan',
    emoji: '🌙',
    keywords: 'ramadan recipes, iftar ideas, suhoor ideas, sehri recipes, halal dinner, iftar from fridge',
    sections: [
      { key: 'iftar', rule: IFTAR },
      { key: 'suhoor', rule: SUHOOR },
    ],
    copy: {
      en: {
        title: 'Ramadan recipes: iftar & suhoor ideas from your fridge',
        h1: 'Ramadan: iftar & suhoor from your fridge',
        intro: 'Break your fast with what you already have. Halal, pork-free iftar favourites — lentil soup, pakoras, kebabs, biryani — plus quick suhoor ideas that keep you full.',
        sections: {
          iftar: { h: 'Iftar from your fridge', p: 'Soups, chaat, kebabs and rice dishes for the whole table.' },
          suhoor: { h: 'Quick suhoor ideas', p: 'Ready in 30 minutes or less — eggs, yogurt and filling bowls.' },
        },
        tips: [
          'Cook a big pot of lentil soup on day one — it keeps for 3 days.',
          'Soak chickpeas or lentils before taraweeh for tomorrow’s iftar.',
          'Leftover rice becomes fried rice or pulao for suhoor.',
        ],
      },
      ar: {
        title: 'وصفات رمضان: أفكار للإفطار والسحور من ثلاجتك',
        h1: 'رمضان: إفطار وسحور من ثلاجتك',
        intro: 'أفطر بما لديك في البيت. أطباق إفطار حلال وخالية من لحم الخنزير — شوربة العدس، الكباب، البرياني — وأفكار سحور سريعة تشبعك حتى المغرب.',
        sections: {
          iftar: { h: 'إفطار من ثلاجتك', p: 'شوربات ومقبلات وكباب وأطباق أرز لكل العائلة.' },
          suhoor: { h: 'أفكار سحور سريعة', p: 'جاهزة في ٣٠ دقيقة أو أقل — بيض ولبن وأطباق مشبعة.' },
        },
        tips: [
          'اطبخ قدرًا كبيرًا من شوربة العدس في أول يوم — تبقى ٣ أيام.',
          'انقع الحمص أو العدس قبل التراويح لإفطار الغد.',
          'الأرز المتبقي يصبح أرزًا مقليًا أو بلاو للسحور.',
        ],
      },
      ur: {
        title: 'رمضان کی ترکیبیں: فریج سے افطار اور سحری',
        h1: 'رمضان: فریج سے افطار اور سحری',
        intro: 'جو گھر میں موجود ہے اسی سے روزہ کھولیں۔ حلال افطار — دال کا شوربہ، پکوڑے، کباب، بریانی — اور سحری کے آسان آئیڈیاز جو دن بھر پیٹ بھرا رکھیں۔',
        sections: {
          iftar: { h: 'فریج سے افطار', p: 'شوربے، چاٹ، کباب اور چاول — پورے دسترخوان کے لیے۔' },
          suhoor: { h: 'جلدی سحری', p: '۳۰ منٹ یا کم میں تیار — انڈے، دہی اور پیٹ بھرنے والے باؤل۔' },
        },
        tips: [
          'پہلے دن دال کا بڑا شوربہ بنائیں — ۳ دن چلتا ہے۔',
          'تراویح سے پہلے کل کی افطار کے لیے چنے یا دال بھگو دیں۔',
          'بچے ہوئے چاول سحری میں فرائیڈ رائس یا پلاؤ بن جاتے ہیں۔',
        ],
      },
      es: {
        title: 'Recetas de Ramadán: ideas de iftar y suhoor con lo que tienes',
        h1: 'Ramadán: iftar y suhoor con lo de tu nevera',
        intro: 'Rompe el ayuno con lo que ya tienes. Platos halal y sin cerdo — sopa de lentejas, pakoras, kebabs, biryani — y suhoor rápido que te mantiene saciado.',
        sections: {
          iftar: { h: 'Iftar con lo de tu nevera', p: 'Sopas, chaat, kebabs y arroces para toda la mesa.' },
          suhoor: { h: 'Suhoor rápido', p: 'Listo en 30 minutos o menos — huevos, yogur y bowls saciantes.' },
        },
        tips: [
          'Haz una olla grande de sopa de lentejas el primer día: dura 3 días.',
          'Remoja garbanzos o lentejas antes del taraweeh para el iftar de mañana.',
          'El arroz sobrante se convierte en arroz frito o pulao para el suhoor.',
        ],
      },
      fr: {
        title: 'Recettes du Ramadan : idées d’iftar et de suhoor avec votre frigo',
        h1: 'Ramadan : iftar et suhoor avec votre frigo',
        intro: 'Rompez le jeûne avec ce que vous avez déjà. Plats halal et sans porc — soupe de lentilles, pakoras, kebabs, biryani — et suhoor rapides et rassasiants.',
        sections: {
          iftar: { h: 'Iftar avec votre frigo', p: 'Soupes, chaat, kebabs et plats de riz pour toute la table.' },
          suhoor: { h: 'Suhoor rapides', p: 'Prêts en 30 minutes ou moins — œufs, yaourt et bols rassasiants.' },
        },
        tips: [
          'Préparez une grande soupe de lentilles le premier jour : elle se garde 3 jours.',
          'Faites tremper pois chiches ou lentilles avant les tarawih pour l’iftar du lendemain.',
          'Le riz restant devient riz sauté ou pulao pour le suhoor.',
        ],
      },
      tr: {
        title: 'Ramazan tarifleri: buzdolabından iftar ve sahur fikirleri',
        h1: 'Ramazan: buzdolabından iftar ve sahur',
        intro: 'Orucunu evdekilerle aç. Helal, domuz ürünsüz iftar klasikleri — mercimek çorbası, pakora, kebap, biryani — ve tok tutan hızlı sahur fikirleri.',
        sections: {
          iftar: { h: 'Buzdolabından iftar', p: 'Çorbalar, mezeler, kebaplar ve pilavlar — tüm sofra için.' },
          suhoor: { h: 'Hızlı sahur fikirleri', p: '30 dakikada hazır — yumurta, yoğurt ve doyurucu kaseler.' },
        },
        tips: [
          'İlk gün büyük bir tencere mercimek çorbası yap — 3 gün dayanır.',
          'Yarının iftarı için teravihten önce nohut ya da mercimeği ıslat.',
          'Artan pilav sahurda kızarmış pilava dönüşür.',
        ],
      },
    },
  },
  {
    slug: 'eid',
    emoji: '🎉',
    keywords: 'eid recipes, eid leftovers, eid ul adha meat recipes, eid dinner, leftover biryani, leftover lamb',
    sections: [
      { key: 'feast', rule: EID_FEAST },
      { key: 'leftovers', rule: EID_LEFTOVER },
    ],
    copy: {
      en: {
        title: 'Eid recipes & Eid leftovers: feast dishes and next-day dinners',
        h1: 'Eid: feast dishes & leftover makeovers',
        intro: 'Biryani, korma, kebabs and mandi for the Eid table — then quick ways to turn leftover meat and rice into tomorrow’s dinner. Halal, no pork.',
        sections: {
          feast: { h: 'Eid feast dishes', p: 'Big-pot favourites for family and guests.' },
          leftovers: { h: 'Eid leftovers → dinner', p: 'Leftover meat or rice? Wraps, keema and fried rice in 30 minutes.' },
        },
        tips: [
          'Eid ul Adha meat: freeze in 500 g bags so each bag is one dinner.',
          'Shred leftover roast or kebab into wraps with yogurt sauce.',
          'Leftover biryani reheats best with a splash of water and a lid.',
        ],
      },
      ar: {
        title: 'وصفات العيد وبقايا العيد: أطباق الوليمة وعشاء اليوم التالي',
        h1: 'العيد: أطباق الوليمة وتحويل البقايا',
        intro: 'برياني وكباب ومندي وكبسة لمائدة العيد — ثم طرق سريعة لتحويل اللحم والأرز المتبقي إلى عشاء الغد. حلال وبدون لحم خنزير.',
        sections: {
          feast: { h: 'أطباق وليمة العيد', p: 'أطباق القدر الكبير للعائلة والضيوف.' },
          leftovers: { h: 'بقايا العيد ← عشاء', p: 'لحم أو أرز متبقٍ؟ لفائف وكيمة وأرز مقلي في ٣٠ دقيقة.' },
        },
        tips: [
          'لحم الأضحى: جمّده في أكياس ٥٠٠ غ، كل كيس عشاء واحد.',
          'قطّع اللحم المشوي المتبقي في لفائف مع صلصة اللبن.',
          'يسخن البرياني المتبقي بشكل أفضل مع قليل من الماء وغطاء.',
        ],
      },
      ur: {
        title: 'عید کی ترکیبیں اور عید کا بچا ہوا کھانا',
        h1: 'عید: دعوت کے پکوان اور بچے کھانے کا نیا روپ',
        intro: 'عید کے دسترخوان کے لیے بریانی، قورمہ، کباب اور مندی — پھر بچے ہوئے گوشت اور چاول سے اگلے دن کا جلدی کھانا۔ حلال، بغیر سور کے گوشت کے۔',
        sections: {
          feast: { h: 'عید کی دعوت کے پکوان', p: 'گھر والوں اور مہمانوں کے لیے بڑی دیگ کے پسندیدہ کھانے۔' },
          leftovers: { h: 'عید کا بچا کھانا ← ڈنر', p: 'گوشت یا چاول بچ گئے؟ رول، قیمہ اور فرائیڈ رائس ۳۰ منٹ میں۔' },
        },
        tips: [
          'قربانی کا گوشت ۵۰۰ گرام کی تھیلیوں میں فریز کریں — ہر تھیلی ایک ڈنر۔',
          'بچے ہوئے کباب یا روسٹ کو دہی کی چٹنی کے ساتھ رول میں ڈالیں۔',
          'بچی بریانی تھوڑا پانی ڈال کر ڈھک کر گرم کریں۔',
        ],
      },
      es: {
        title: 'Recetas de Eid y sobras de Eid: platos de fiesta y cenas del día siguiente',
        h1: 'Eid: platos de fiesta y sobras renovadas',
        intro: 'Biryani, korma, kebabs y mandi para la mesa de Eid, y formas rápidas de convertir la carne y el arroz sobrantes en la cena de mañana. Halal, sin cerdo.',
        sections: {
          feast: { h: 'Platos de fiesta de Eid', p: 'Favoritos de olla grande para familia e invitados.' },
          leftovers: { h: 'Sobras de Eid → cena', p: '¿Sobró carne o arroz? Wraps, keema y arroz frito en 30 minutos.' },
        },
        tips: [
          'Carne de Eid al-Adha: congélala en bolsas de 500 g, una bolsa por cena.',
          'Desmenuza el asado o kebab sobrante en wraps con salsa de yogur.',
          'El biryani sobrante se recalienta mejor con un chorrito de agua y tapa.',
        ],
      },
      fr: {
        title: 'Recettes de l’Aïd et restes de l’Aïd : plats de fête et dîners du lendemain',
        h1: 'Aïd : plats de fête et restes revisités',
        intro: 'Biryani, korma, kebabs et mandi pour la table de l’Aïd — puis des idées rapides pour transformer viande et riz restants en dîner du lendemain. Halal, sans porc.',
        sections: {
          feast: { h: 'Plats de fête de l’Aïd', p: 'Grandes marmites pour la famille et les invités.' },
          leftovers: { h: 'Restes de l’Aïd → dîner', p: 'Viande ou riz en trop ? Wraps, keema et riz sauté en 30 minutes.' },
        },
        tips: [
          'Viande de l’Aïd al-Adha : congelez-la en sachets de 500 g, un sachet par dîner.',
          'Effilochez le rôti ou les kebabs restants dans des wraps sauce yaourt.',
          'Le biryani restant se réchauffe mieux avec un peu d’eau et un couvercle.',
        ],
      },
      tr: {
        title: 'Bayram tarifleri ve bayram artıkları: sofra yemekleri ve ertesi gün akşam yemekleri',
        h1: 'Bayram: sofra yemekleri ve artık dönüşümü',
        intro: 'Bayram sofrası için biryani, korma, kebap ve mandi — sonra artan et ve pilavı ertesi günün akşam yemeğine çevirmenin hızlı yolları. Helal, domuz yok.',
        sections: {
          feast: { h: 'Bayram sofrası', p: 'Aile ve misafirler için büyük tencere klasikleri.' },
          leftovers: { h: 'Bayram artıkları → akşam yemeği', p: 'Et ya da pilav mı arttı? Dürüm, kıyma ve kızarmış pilav 30 dakikada.' },
        },
        tips: [
          'Kurban etini 500 g’lık poşetlerde dondur — her poşet bir akşam yemeği.',
          'Artan kebabı yoğurt soslu dürüme çevir.',
          'Artan biryaniyi biraz su ekleyip kapağı kapalı ısıt.',
        ],
      },
    },
  },
  {
    slug: 'desi',
    emoji: '🍛',
    keywords: 'desi recipes, pakistani dinner, indian dinner, karahi, daal chawal, biryani, desi food from fridge',
    sections: [
      { key: 'classics', rule: DESI_MAIN },
      { key: 'quick', rule: DESI_QUICK },
    ],
    copy: {
      en: {
        title: 'Desi dinner recipes from your fridge — karahi, daal, biryani',
        h1: 'Desi dinners from your fridge',
        intro: 'Pakistani, Indian and Bangladeshi home cooking — karahi, daal chawal, aloo sabzi, keema and biryani — matched to what’s already in your fridge. Halal, no pork.',
        sections: {
          classics: { h: 'Desi classics', p: 'The dinners ammi makes — curries, daal and rice.' },
          quick: { h: 'Desi in 30 minutes', p: 'Weeknight bhurji, keema and daal when you’re short on time.' },
        },
        tips: [
          'Onion, tomato, ginger-garlic and garam masala turn almost anything into a salan.',
          'Make a jar of bhuna masala on the weekend — dinner in 15 minutes all week.',
          'Leftover roti? Make a quick egg roll or chips for chaat.',
        ],
      },
      ar: {
        title: 'وصفات عشاء ديسي من ثلاجتك — كراهي، دال، برياني',
        h1: 'عشاء ديسي من ثلاجتك',
        intro: 'طبخ البيت الباكستاني والهندي والبنغالي — كراهي ودال بالأرز وبطاطا بالبهارات وكيمة وبرياني — حسب ما في ثلاجتك. حلال وبدون لحم خنزير.',
        sections: {
          classics: { h: 'أطباق ديسي كلاسيكية', p: 'أطباق البيت — كاري ودال وأرز.' },
          quick: { h: 'ديسي في ٣٠ دقيقة', p: 'بيض بهارات وكيمة ودال لأيام الأسبوع المزدحمة.' },
        },
        tips: [
          'البصل والطماطم والزنجبيل والثوم والجرام ماسالا تحوّل أي شيء إلى صالونة.',
          'حضّر برطمان ماسالا في العطلة — عشاء في ١٥ دقيقة طوال الأسبوع.',
          'خبز روتي متبقٍ؟ اصنع لفافة بيض سريعة.',
        ],
      },
      ur: {
        title: 'فریج سے دیسی کھانے — کڑاہی، دال، بریانی',
        h1: 'فریج سے دیسی ڈنر',
        intro: 'پاکستانی، انڈین اور بنگالی گھر کا کھانا — کڑاہی، دال چاول، آلو کی سبزی، قیمہ اور بریانی — جو آپ کے فریج میں ہے اسی سے۔ حلال، بغیر سور کے گوشت کے۔',
        sections: {
          classics: { h: 'دیسی پسندیدہ کھانے', p: 'امی والے کھانے — سالن، دال اور چاول۔' },
          quick: { h: '۳۰ منٹ میں دیسی', p: 'مصروف دنوں کے لیے انڈا بھرجی، قیمہ اور دال۔' },
        },
        tips: [
          'پیاز، ٹماٹر، ادرک لہسن اور گرم مصالحہ — تقریباً ہر چیز کا سالن بن جاتا ہے۔',
          'ویک اینڈ پر بھنا مصالحہ جار میں رکھ لیں — پورا ہفتہ ۱۵ منٹ میں ڈنر۔',
          'روٹی بچ گئی؟ جلدی سے انڈا رول بنا لیں۔',
        ],
      },
      es: {
        title: 'Recetas desi con lo de tu nevera — karahi, daal, biryani',
        h1: 'Cenas desi con lo de tu nevera',
        intro: 'Cocina casera pakistaní, india y bangladesí — karahi, daal con arroz, aloo sabzi, keema y biryani — con lo que ya tienes. Halal, sin cerdo.',
        sections: {
          classics: { h: 'Clásicos desi', p: 'Las cenas de casa: currys, daal y arroz.' },
          quick: { h: 'Desi en 30 minutos', p: 'Bhurji, keema y daal para noches con prisa.' },
        },
        tips: [
          'Cebolla, tomate, jengibre-ajo y garam masala convierten casi todo en un salan.',
          'Prepara un frasco de masala el fin de semana: cena en 15 minutos toda la semana.',
          '¿Sobró roti? Haz un rollito rápido de huevo.',
        ],
      },
      fr: {
        title: 'Recettes desi avec votre frigo — karahi, daal, biryani',
        h1: 'Dîners desi avec votre frigo',
        intro: 'Cuisine maison pakistanaise, indienne et bangladaise — karahi, daal chawal, aloo sabzi, keema et biryani — selon ce que vous avez. Halal, sans porc.',
        sections: {
          classics: { h: 'Classiques desi', p: 'Les dîners de la maison : currys, daal et riz.' },
          quick: { h: 'Desi en 30 minutes', p: 'Bhurji, keema et daal pour les soirs pressés.' },
        },
        tips: [
          'Oignon, tomate, gingembre-ail et garam masala transforment presque tout en salan.',
          'Préparez un bocal de masala le week-end : dîner en 15 minutes toute la semaine.',
          'Des rotis en trop ? Faites un roulé à l’œuf express.',
        ],
      },
      tr: {
        title: 'Buzdolabından desi yemekleri — karahi, daal, biryani',
        h1: 'Buzdolabından desi akşam yemekleri',
        intro: 'Pakistan, Hint ve Bangladeş ev yemekleri — karahi, daal chawal, aloo sabzi, keema ve biryani — dolabındakilerle. Helal, domuz yok.',
        sections: {
          classics: { h: 'Desi klasikleri', p: 'Evin yemekleri — köriler, daal ve pilav.' },
          quick: { h: '30 dakikada desi', p: 'Yoğun akşamlar için bhurji, keema ve daal.' },
        },
        tips: [
          'Soğan, domates, zencefil-sarımsak ve garam masala neredeyse her şeyi salana çevirir.',
          'Hafta sonu bir kavanoz masala hazırla — bütün hafta 15 dakikada akşam yemeği.',
          'Roti mi arttı? Hızlı bir yumurtalı dürüm yap.',
        ],
      },
    },
  },
  {
    slug: 'arabic',
    emoji: '🥙',
    keywords: 'arabic recipes, middle eastern dinner, kabsa, mandi, shakshuka, hummus, arabic food from fridge',
    sections: [
      { key: 'classics', rule: ARABIC_MAIN },
      { key: 'quick', rule: ARABIC_QUICK },
    ],
    copy: {
      en: {
        title: 'Arabic dinner recipes from your fridge — kabsa, mandi, shakshuka',
        h1: 'Arabic dinners from your fridge',
        intro: 'Gulf, Levantine and North African home cooking — kabsa, mandi, shawarma, fatteh, shakshuka and hummus bowls — matched to what you already have. Halal, no pork.',
        sections: {
          classics: { h: 'Arabic classics', p: 'Rice platters, grills and family-style dishes.' },
          quick: { h: 'Arabic in 30 minutes', p: 'Shakshuka, hummus bowls and wraps for busy nights.' },
        },
        tips: [
          'Baharat or kabsa spice + rice + any protein = a one-pot dinner.',
          'Leftover chicken becomes shawarma wraps with garlic sauce.',
          'Stale bread? Toast it for fatteh or fattoush.',
        ],
      },
      ar: {
        title: 'وصفات عشاء عربية من ثلاجتك — كبسة، مندي، شكشوكة',
        h1: 'عشاء عربي من ثلاجتك',
        intro: 'طبخ البيت الخليجي والشامي والمغاربي — كبسة ومندي وشاورما وفتة وشكشوكة وأطباق حمص — حسب ما لديك. حلال وبدون لحم خنزير.',
        sections: {
          classics: { h: 'أطباق عربية كلاسيكية', p: 'صواني أرز ومشاوي وأطباق عائلية.' },
          quick: { h: 'عربي في ٣٠ دقيقة', p: 'شكشوكة وحمص ولفائف للأيام المزدحمة.' },
        },
        tips: [
          'بهارات الكبسة + أرز + أي بروتين = عشاء في قدر واحد.',
          'الدجاج المتبقي يصبح لفائف شاورما مع الثومية.',
          'خبز يابس؟ حمّصه للفتة أو الفتوش.',
        ],
      },
      ur: {
        title: 'فریج سے عربی کھانے — کبسہ، مندی، شکشوکہ',
        h1: 'فریج سے عربی ڈنر',
        intro: 'خلیجی، شامی اور شمالی افریقی گھر کا کھانا — کبسہ، مندی، شوارما، فتہ، شکشوکہ اور حمص — جو آپ کے پاس ہے اسی سے۔ حلال، بغیر سور کے گوشت کے۔',
        sections: {
          classics: { h: 'عربی پسندیدہ کھانے', p: 'چاولوں کے تھال، گرل اور گھر والوں کے ساتھ کھانے والے پکوان۔' },
          quick: { h: '۳۰ منٹ میں عربی', p: 'مصروف راتوں کے لیے شکشوکہ، حمص اور رول۔' },
        },
        tips: [
          'کبسہ مصالحہ + چاول + کوئی بھی گوشت = ایک دیگچی کا ڈنر۔',
          'بچا ہوا چکن لہسن کی چٹنی کے ساتھ شوارما رول بن جاتا ہے۔',
          'باسی روٹی؟ فتہ یا فتوش کے لیے سینک لیں۔',
        ],
      },
      es: {
        title: 'Recetas árabes con lo de tu nevera — kabsa, mandi, shakshuka',
        h1: 'Cenas árabes con lo de tu nevera',
        intro: 'Cocina casera del Golfo, el Levante y el norte de África — kabsa, mandi, shawarma, fatteh, shakshuka y bowls de hummus — con lo que ya tienes. Halal, sin cerdo.',
        sections: {
          classics: { h: 'Clásicos árabes', p: 'Bandejas de arroz, parrilla y platos para compartir.' },
          quick: { h: 'Árabe en 30 minutos', p: 'Shakshuka, hummus y wraps para noches con prisa.' },
        },
        tips: [
          'Especias kabsa + arroz + cualquier proteína = cena en una olla.',
          'El pollo sobrante se convierte en wraps de shawarma con salsa de ajo.',
          '¿Pan duro? Tuéstalo para fatteh o fattoush.',
        ],
      },
      fr: {
        title: 'Recettes arabes avec votre frigo — kabsa, mandi, chakchouka',
        h1: 'Dîners arabes avec votre frigo',
        intro: 'Cuisine maison du Golfe, du Levant et du Maghreb — kabsa, mandi, shawarma, fatteh, chakchouka et bols de houmous — selon ce que vous avez. Halal, sans porc.',
        sections: {
          classics: { h: 'Classiques arabes', p: 'Plateaux de riz, grillades et plats à partager.' },
          quick: { h: 'Arabe en 30 minutes', p: 'Chakchouka, houmous et wraps pour les soirs pressés.' },
        },
        tips: [
          'Épices kabsa + riz + n’importe quelle protéine = un dîner en une cocotte.',
          'Le poulet restant devient des wraps shawarma sauce à l’ail.',
          'Du pain rassis ? Grillez-le pour une fatteh ou un fattouche.',
        ],
      },
      tr: {
        title: 'Buzdolabından Arap yemekleri — kabsa, mandi, şakşuka',
        h1: 'Buzdolabından Arap akşam yemekleri',
        intro: 'Körfez, Levant ve Kuzey Afrika ev yemekleri — kabsa, mandi, döner dürüm, fatteh, şakşuka ve humus kaseleri — elindekilerle. Helal, domuz yok.',
        sections: {
          classics: { h: 'Arap klasikleri', p: 'Pilav tepsileri, ızgaralar ve paylaşımlık tabaklar.' },
          quick: { h: '30 dakikada Arap mutfağı', p: 'Yoğun akşamlar için şakşuka, humus ve dürüm.' },
        },
        tips: [
          'Kabsa baharatı + pirinç + herhangi bir protein = tek tencere akşam yemeği.',
          'Artan tavuk sarımsak soslu dürüm olur.',
          'Bayat ekmek mi? Fatteh ya da fattuş için kızart.',
        ],
      },
    },
  },
]

export function hubBySlug(slug: string): HubDef | undefined {
  return HUBS.find((h) => h.slug === slug)
}

export function hubCopy(hub: HubDef, locale: string): HubCopy {
  return hub.copy[(locale as HubLocale) in hub.copy ? (locale as HubLocale) : 'en']
}

/** Curate recipes for each section of a hub from the catalog (halal-only, no alcohol). */
export function curateHub(hub: HubDef, catalog: CatalogEntry[], perSection = 18): Record<string, CatalogEntry[]> {
  const pool = catalog.filter(
    (e) => e.g.includes('halal') && !HALAL_EXCLUDE.test(`${e.t} ${e.i.join(' ')}`),
  )
  const used = new Set<string>()
  const out: Record<string, CatalogEntry[]> = {}
  for (const s of hub.sections) {
    const list = filterHub(pool, s.rule, perSection * 2).filter((e) => !used.has(e.id)).slice(0, perSection)
    for (const e of list) used.add(e.id)
    out[s.key] = list
  }
  return out
}
