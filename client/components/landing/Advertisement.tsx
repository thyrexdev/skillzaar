import React from 'react'

const Advertisement = () => {
  return (
  <section>
    <div className="bg-[#9C7CFD]/20 rounded-xl flex flex-col md:flex-row items-center justify-between px-8 py-6 my-10">
  <div className="w-full md:w-1/2 text-right space-y-4">
    <h2 className="text-xl font-bold text-[#4A3DA5]">فرصتك للانطلاق تبدأ من هنا</h2>
    <p className="text-sm text-gray-700">
      سجل الآن وابدأ في تقديم خدماتك أو تصفح <br />المشاريع المنشورة، وكن جزءًا من مجتمع العمل<br /> الحر الاحترافي.
    </p>
    <button className="bg-white border px-5 py-2 rounded-md shadow-sm text-[#4A3DA5] font-semibold">
      سجل الآن
    </button>
  </div>
    <div className="w-full md:w-1/2 mb-4 md:mb-0">
    <img src="/women.png" alt="cta" className="rounded-xl w-full max-w-xs mx-auto md:mx-0" />
  </div>
</div>
  </section>
  )
}

export default Advertisement