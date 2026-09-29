/**
 * Friendly error copy. Keys are `err.<kind>` (see lib/friendlyError.ts).
 * No technical jargon (provider names, status codes, "server", "API") in any locale.
 */
import type { Dict } from './translations'

const en: Dict = {
  'err.busy': 'Our kitchen helper is busy right now. Please try again in a minute.',
  'err.unavailable': 'Our kitchen helper is taking a short break. Please try again soon.',
  'err.bad_image': "We couldn't read that photo. Try a clear, well-lit photo of your fridge or pantry.",
  'err.quota_exceeded': "You've used your free smart scans. You can still type ingredients and browse recipes for free.",
  'err.rate_limited': "You're going a little fast. Please wait a moment and try again.",
  'err.offline': "Looks like you're offline. Check your connection and try again.",
  'err.not_found': "We couldn't find that. It may have moved.",
  'err.generic': 'Something went wrong. Please try again.',
  'err.tryAgain': 'Try again',
  'err.alternatives': 'Or try a sample fridge, or type your ingredients instead.',
  'err.typeIngredients': 'Type ingredients',
  'err.noScanUsed': "Don't worry — this didn't use one of your free scans.",
}

const ar: Dict = {
  'err.busy': 'مساعد المطبخ مشغول الآن. يُرجى المحاولة مرة أخرى بعد دقيقة.',
  'err.unavailable': 'مساعد المطبخ في استراحة قصيرة. يُرجى المحاولة مرة أخرى قريبًا.',
  'err.bad_image': 'تعذّرت قراءة هذه الصورة. جرّب صورة واضحة وجيدة الإضاءة لثلاجتك أو مخزنك.',
  'err.quota_exceeded': 'لقد استخدمت عمليات المسح الذكية المجانية. لا يزال بإمكانك كتابة المكونات وتصفح الوصفات مجانًا.',
  'err.rate_limited': 'أنت سريع قليلًا! انتظر لحظة ثم حاول مرة أخرى.',
  'err.offline': 'يبدو أنك غير متصل. تحقّق من اتصالك وحاول مرة أخرى.',
  'err.not_found': 'لم نتمكن من العثور على ذلك. ربما تم نقله.',
  'err.generic': 'حدث خطأ ما. يُرجى المحاولة مرة أخرى.',
  'err.tryAgain': 'حاول مرة أخرى',
  'err.alternatives': 'أو جرّب ثلاجة تجريبية، أو اكتب مكوناتك بنفسك.',
  'err.typeIngredients': 'اكتب المكونات',
  'err.noScanUsed': 'لا تقلق — لم يُحتسب هذا من عمليات المسح المجانية.',
}

const es: Dict = {
  'err.busy': 'Nuestro ayudante de cocina está ocupado ahora mismo. Inténtalo de nuevo en un minuto.',
  'err.unavailable': 'Nuestro ayudante de cocina se está tomando un descanso. Inténtalo de nuevo pronto.',
  'err.bad_image': 'No pudimos leer esa foto. Prueba con una foto clara y bien iluminada de tu nevera o despensa.',
  'err.quota_exceeded': 'Has usado tus escaneos inteligentes gratis. Aún puedes escribir ingredientes y explorar recetas gratis.',
  'err.rate_limited': 'Vas un poco rápido. Espera un momento e inténtalo de nuevo.',
  'err.offline': 'Parece que no tienes conexión. Revísala e inténtalo de nuevo.',
  'err.not_found': 'No pudimos encontrarlo. Puede que se haya movido.',
  'err.generic': 'Algo salió mal. Inténtalo de nuevo.',
  'err.tryAgain': 'Intentar de nuevo',
  'err.alternatives': 'O prueba una nevera de ejemplo, o escribe tus ingredientes.',
  'err.typeIngredients': 'Escribir ingredientes',
  'err.noScanUsed': 'Tranquilo: esto no ha gastado ninguno de tus escaneos gratis.',
}

const fr: Dict = {
  'err.busy': 'Notre assistant cuisine est très occupé en ce moment. Réessayez dans une minute.',
  'err.unavailable': 'Notre assistant cuisine fait une petite pause. Réessayez bientôt.',
  'err.bad_image': "Nous n'avons pas pu lire cette photo. Essayez une photo nette et bien éclairée de votre frigo ou placard.",
  'err.quota_exceeded': 'Vous avez utilisé vos analyses intelligentes gratuites. Vous pouvez toujours saisir vos ingrédients et parcourir les recettes gratuitement.',
  'err.rate_limited': 'Vous allez un peu vite. Patientez un instant puis réessayez.',
  'err.offline': 'Vous semblez hors ligne. Vérifiez votre connexion et réessayez.',
  'err.not_found': "Nous ne l'avons pas trouvé. Il a peut-être été déplacé.",
  'err.generic': "Un problème est survenu. Veuillez réessayer.",
  'err.tryAgain': 'Réessayer',
  'err.alternatives': 'Ou essayez un frigo exemple, ou saisissez vos ingrédients.',
  'err.typeIngredients': 'Saisir les ingrédients',
  'err.noScanUsed': "Pas d'inquiétude : cela n'a utilisé aucune de vos analyses gratuites.",
}

const tr: Dict = {
  'err.busy': 'Mutfak yardımcımız şu anda çok yoğun. Lütfen bir dakika sonra tekrar deneyin.',
  'err.unavailable': 'Mutfak yardımcımız kısa bir mola verdi. Lütfen birazdan tekrar deneyin.',
  'err.bad_image': 'Bu fotoğrafı okuyamadık. Buzdolabınızın veya kilerinizin net ve iyi aydınlatılmış bir fotoğrafını deneyin.',
  'err.quota_exceeded': 'Ücretsiz akıllı taramalarınızı kullandınız. Yine de malzemeleri yazabilir ve tarifleri ücretsiz inceleyebilirsiniz.',
  'err.rate_limited': 'Biraz hızlı gidiyorsunuz. Lütfen bir an bekleyip tekrar deneyin.',
  'err.offline': 'Çevrimdışı görünüyorsunuz. Bağlantınızı kontrol edip tekrar deneyin.',
  'err.not_found': 'Bunu bulamadık. Taşınmış olabilir.',
  'err.generic': 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
  'err.tryAgain': 'Tekrar dene',
  'err.alternatives': 'Ya da örnek bir buzdolabını deneyin veya malzemelerinizi yazın.',
  'err.typeIngredients': 'Malzemeleri yaz',
  'err.noScanUsed': 'Merak etmeyin — bu, ücretsiz taramalarınızdan birini kullanmadı.',
}

const ur: Dict = {
  'err.busy': 'ہمارا کچن ہیلپر اس وقت مصروف ہے۔ براہ کرم ایک منٹ بعد دوبارہ کوشش کریں۔',
  'err.unavailable': 'ہمارا کچن ہیلپر تھوڑے وقفے پر ہے۔ براہ کرم جلد دوبارہ کوشش کریں۔',
  'err.bad_image': 'ہم یہ تصویر نہیں پڑھ سکے۔ اپنے فرج یا پینٹری کی صاف اور روشن تصویر آزمائیں۔',
  'err.quota_exceeded': 'آپ اپنے مفت سمارٹ اسکین استعمال کر چکے ہیں۔ آپ اب بھی اجزاء لکھ سکتے ہیں اور ریسیپیز مفت دیکھ سکتے ہیں۔',
  'err.rate_limited': 'آپ تھوڑا تیز چل رہے ہیں۔ براہ کرم ایک لمحہ انتظار کر کے دوبارہ کوشش کریں۔',
  'err.offline': 'لگتا ہے آپ آف لائن ہیں۔ اپنا کنکشن چیک کر کے دوبارہ کوشش کریں۔',
  'err.not_found': 'ہمیں یہ نہیں ملا۔ شاید اسے منتقل کر دیا گیا ہے۔',
  'err.generic': 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
  'err.tryAgain': 'دوبارہ کوشش کریں',
  'err.alternatives': 'یا نمونہ فرج آزمائیں، یا اپنے اجزاء خود لکھیں۔',
  'err.typeIngredients': 'اجزاء لکھیں',
  'err.noScanUsed': 'فکر نہ کریں — اس سے آپ کا کوئی مفت اسکین استعمال نہیں ہوا۔',
}

export const ERROR_STRINGS = { en, ar, es, fr, tr, ur }
