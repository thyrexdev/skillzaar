import Image from 'next/image'
import React from 'react'

const WhyFreivico = () => {
  return (
    <section className='container min-h-screen  bg-white'>
      <div className="grid md:grid-cols-2  p-5 ">
         <div className="flex flex-col gap-4">
         <Image
            src="/المبرمج.png"
            className=" rounded-md"
            alt="developer" width={500} height={700}
          />
        </div>
        <div className="flex flex-col justify-center space-y-4 text-right">
          <h3 className="text-sm text-orange-500 font-semibold">
            ما هي منصة Freevix
          </h3>
          <h2 className="text-2xl font-bold text-blue-900">أصحاب المشاريع</h2>
          <p className="text-gray-700 leading-relaxed">
            لا تفوّت الفرصة. <br /> 
            مع خبرتنا في السوق، نساعدك في اكتشاف ما يميز علامتك
            <br />
            التجارية، ونربطك بالمستقل الأنسب لإنجاز مشروعك. <br />
            حلّل جمهورك، وتابع ما يبحث عنه، لتكسب ولاء عملائك وتحقق نتائج أفضل.
          </p>
          <button className="bg-orange-400 text-white px-5 py-2 rounded-md w-fit">
            انشر الآن وابدأ مشروعك
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 p-10 bg-white">
        <div className="flex flex-col justify-center space-y-4 text-right">
          <h2 className="text-2xl font-bold text-blue-900">للمستقلين</h2>
          <p className="text-gray-700 leading-relaxed">
            ابدأ رحلتك المهنية الآن،<br />  أنشئ ملفك التعريفي وقدم على مشاريع حقيقيه تناسب <br />
            مهاراتك،<br />  نحن نساعدك على الظهور، بناء الثقة، والحصول على دخل  <br />مستمر من خلال بيئة عمل احترافية وآمنة       </p>
          <button className="bg-orange-400 text-white px-5 py-2 rounded-md w-fit self-end">
            انضم الأن كمستقل
          </button>
        </div>
        <div className="flex flex-col gap-4">
        <Image
            src="/الرسامه.jpg"
            alt="designer"
            className=" rounded-md" width={500} height={700}
          />
        </div>
      </div>
    </section>
  )
}

export default WhyFreivico