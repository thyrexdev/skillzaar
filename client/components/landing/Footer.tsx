import React from 'react'

const Footer = () => {
  return (
    <section>
         <footer className="bg-gray-100 py-10 px-6 md:px-20 text-right">
  <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
    
    {/* اللوجو والنص */}
    <div className="md:col-span-1">
      <h1 className="font-bold text-xl mb-2">Logo</h1>
      <p className="text-sm text-gray-600">يربطك بأفضل المستقلين لتنفيذ مشاريعك بكفاءة وسهولة.</p>
    </div>

    {/* روابط سريعة */}
    <div>
 <h3 className="font-semibold mb-2">روابط سريعه</h3>
      <ul className="space-y-1 text-sm text-gray-600">
        <li>الرئيسية</li>
        <li>تصفح الخدمات</li>
        <li>المشاريع المفتوحة</li>
        <li>كيف يعمل الموقع؟</li>
        <li>الأسئلة الشائعة</li>
        <li>تواصل معنا</li>
      </ul>
    </div>

    {/* خدمات المنصة */}
    <div>
      <h3 className="font-semibold mb-2">خدمات المنصة</h3>
      <ul className="space-y-1 text-sm text-gray-600">
        <li>تصميم شعارات</li>
        <li>كتابة المحتوى</li>
        <li>تطوير المواقع</li>
        <li>الترجمة</li>
        <li>التسويق الإلكتروني</li>
      </ul>
    </div>

    {/* روابط قانونية */}
    <div>
      <h3 className="font-semibold mb-2">روابط قانونية</h3>
      <ul className="space-y-1 text-sm text-gray-600">
        <li>الشروط والأحكام</li>
        <li>سياسة الخصوصية</li>
        <li>اتفاقية الاستخدام</li>
        <li>حقوق النشر</li>
      </ul>
    </div>
  </div>

  {/* أسفل الفوتر */}
  <div className="mt-10 flex justify-between items-center text-sm text-gray-500 flex-col md:flex-row gap-4">
    <p>© Frevix International Ltd. 2025</p>
    <div className="flex space-x-4 rtl:space-x-reverse">
      <i className="fab fa-facebook"></i>
      <i className="fab fa-twitter"></i>
 <i className="fab fa-linkedin"></i>
      <i className="fab fa-pinterest"></i>
      <i className="fab fa-instagram"></i>
    </div>
  </div>
</footer>
    </section>
  )
}

export default Footer