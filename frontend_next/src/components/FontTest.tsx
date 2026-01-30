export default function FontTest() {
  return (
    <div className="p-8 space-y-4 bg-white text-black">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-geometria font-bold mb-2">
          Geometria Bold - Русский текст
        </h1>
        <p className="text-lg font-geometria">
          Geometria Regular - Проверка кириллицы
        </p>
      </div>
      
      <div className="border-b pb-4">
        <h2 className="text-2xl font-inter font-bold mb-2">
          Inter Bold - Русский текст
        </h2>
        <p className="text-base font-inter">
          Inter Regular - Проверка кириллицы
        </p>
      </div>
      
      <div className="border-b pb-4">
        <h3 className="text-2xl font-cabin font-bold mb-2">
          Cabin Bold - Русский текст
        </h3>
        <p className="text-lg font-cabin font-semibold mb-1">
          Cabin Semibold - Проверка кириллицы
        </p>
        <p className="text-base font-cabin">
          Cabin Regular - Проверка кириллицы
        </p>
      </div>
    </div>
  );
}