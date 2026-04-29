import { Metadata } from 'next';
import Link from 'next/link';
import Header_mini from '@/components/Header_mini';
import Header_mobile from '@/components/Header_mobile';
import Footer from '@/components/Footer';
import FooterMobile from '@/components/Footer_mobile';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных | NIK Studio',
  description:
    'Политика обработки персональных данных ИП Никитин В.А. (NIK Studio) — порядок сбора, хранения и использования персональных данных пользователей сайта.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="relative flex flex-col min-h-screen bg-[#0E1011] max-w-[2560px] w-full mx-auto">
      <Header_mobile />
      <Header_mini />

      <section className="px-5 sm:px-12 lg:px-24 py-12 lg:py-24 text-white font-inter">
        <div className="mx-auto max-w-4xl flex flex-col gap-6 sm:gap-8">
          <h1 className="font-geometria font-bold uppercase text-3xl sm:text-5xl lg:text-6xl leading-tight">
            Политика обработки персональных данных
          </h1>

          <p className="text-white/70 text-sm sm:text-base">
            Действует с момента публикации. Оператор персональных данных:{' '}
            <strong className="text-white">ИП Никитин В.А.</strong>, ИНН{' '}
            <strong className="text-white">501306829802</strong>.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">1. Общие положения</h2>
          <p className="text-white/80 leading-relaxed">
            Настоящая Политика разработана в соответствии с Федеральным законом от 27.07.2006
            № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных
            и меры по обеспечению их безопасности, осуществляемые ИП Никитин В.А. (далее —
            Оператор).
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">2. Состав обрабатываемых данных</h2>
          <ul className="list-disc list-inside text-white/80 leading-relaxed space-y-1">
            <li>имя пользователя;</li>
            <li>адрес электронной почты;</li>
            <li>наименование компании (при указании);</li>
            <li>текст сообщения, направленного через форму обратной связи;</li>
            <li>технические данные (IP-адрес, user-agent) для целей безопасности.</li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">3. Цели обработки</h2>
          <ul className="list-disc list-inside text-white/80 leading-relaxed space-y-1">
            <li>рассмотрение обращений и обратная связь с пользователем;</li>
            <li>заключение и исполнение договоров на оказание услуг;</li>
            <li>при наличии отдельного согласия — направление информационных и рекламных рассылок.</li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">4. Правовые основания</h2>
          <p className="text-white/80 leading-relaxed">
            Обработка осуществляется на основании согласия субъекта персональных данных,
            предоставляемого при отправке формы обратной связи, а также в иных случаях,
            предусмотренных законодательством РФ.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">5. Хранение и защита</h2>
          <p className="text-white/80 leading-relaxed">
            Персональные данные хранятся на серверах, расположенных на территории РФ,
            в течение срока, необходимого для достижения целей обработки. Оператор принимает
            организационные и технические меры для защиты данных от несанкционированного
            доступа, изменения, копирования, распространения и уничтожения.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">6. Права субъекта данных</h2>
          <p className="text-white/80 leading-relaxed">
            Пользователь вправе запросить уточнение, блокирование, удаление своих персональных
            данных, а также отозвать согласие на их обработку. Для этого необходимо направить
            обращение на адрес электронной почты:{' '}
            <a
              href="mailto:info@nikstudio.pro"
              className="underline hover:text-[#DE063A] transition-colors"
            >
              info@nikstudio.pro
            </a>
            .
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold mt-4">7. Контактные данные</h2>
          <p className="text-white/80 leading-relaxed">
            ИП Никитин В.А., ИНН 501306829802. Email: info@nikstudio.pro.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0E1011] font-semibold hover:bg-[#DE063A] hover:text-white transition-colors"
            >
              ← На главную
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FooterMobile />
    </main>
  );
}
