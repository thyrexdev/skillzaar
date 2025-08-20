import React from 'react'

const Frevico = () => {
  return (
  <section className='justify-center container min-h-screen'>
   <div className="py-12 px-6 bg-white text-gray-800">
  <div className=" flex gap-12  mx-auto mb-12">
    <h1 className="text-orange-600 font-semibold text-sm" >ماذا نقدم في Frevix؟ </h1>
    <h2 className="text-2xl font-bold mb-2">
      لا تفوّت الفرصة، نساعدك على إبراز <br /> تميز علامتك والوصول لجمهورك المستهدف<br /> بطريقة فعالة.
    </h2>
    <div>
    <p className="text-gray-600">
      في Frevix، نحلل ما يحبه جمهورك وما يبحث عنه فعليًا، حتى <br />نساعدك في بناء علاقة ولاء حقيقية مع عملائك.
    </p>
    </div>
  </div>  
  <div className="  grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
    <div className="bg-white rounded-lg p-6 shadow-md flex items-start gap-4 " >
      <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
        <img src="/Vector.svg" alt="Web" className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1">تطوير المواقع</h4>
        <p>نُنشئ مواقع احترافية قابلة للتخصيص بسهولة من خلال إعدادات القالب دون الحاجة إلى مهارات برمجية معقدة.  كما نوفر تقنيات تحسين محركات البحث الأساسية مثل استخدام العناوين H1 و H2 و H3 وخريطة التنقل (breadcrumbs) لجعل موقعك مفضلًا لدى محركات البحث مثل Google وBing.</p>
      </div>
  </div>
    <div className="bg-[#1d1b41] text-white rounded-lg p-6 shadow-md flex items-start gap-4">
      <div className="bg-white text-[#1d1b41] p-2 rounded-full">
        <img src="/material-icon-theme_folder-ui-open.svg" alt="UI" className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1">تصميم واجهات الاستخدام (UI)</h4>
        <p>تصميمات عصرية وسهلة الاستخدام تضمن تجربة مستخدم مثالية تعزز من قيمة مشروعك.</p>
      </div>
    </div>
    <div className="bg-white rounded-lg p-6 shadow-md flex items-start gap-4">
      <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
        <img src="/icon-park-outline_graphic-design.svg" alt="Web" className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1"> التصميم الجرافيكي</h4>
        <p>ابتكار هويات بصرية مميزة، دعوات، هدايا رقمية، وكل ما يضفي لمسة احترافية على تواصلك مع العملاء.</p>
      </div>
    </div>
    <div className="bg-white rounded-lg p-6 shadow-md flex items-start gap-4">
      <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
        <img src="/Group 1944.svg" alt="Web" className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1"> دعوات وهدايا رقمية سهل الاستخدام وموثق بالكامل</h4>
        <p>حتى لو كنت مبتدئًا، ستتمكن من استخدام خدماتنا بسهولة تامة، مع توفير توثيق ودليل إرشادي يساعدك خطوة بخطوة.</p>
      </div>
    </div>
  </div>
</div>
  </section>
  )
}

export default Frevico