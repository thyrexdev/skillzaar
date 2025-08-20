import React from 'react'

const Testimonials = () => {
  return (
    <section className='container min-h-screen'>
       <div className="bg-white py-16 px-4 text-center">
  <h2 className="text-3xl font-bold mb-2">آراء عملائنا</h2>
  <p className="text-gray-500 mb-10">نفتخر بثقة عملائنا وتجاربهم الناجحة معنا</p>

  <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
    {/* كارت واحد */}
    <div className="bg-white shadow-md rounded-lg p-6 w-[300px]">
      <img src="/girl.png" alt="client" className="w-16 h-16 mx-auto rounded-full" />
      <h4 className="mt-4 font-semibold">Amira Zakaria</h4>
      <p className="text-sm text-gray-500">Senior Developer</p>
      <p className="mt-3 text-gray-700 text-sm">
        منصة Frevix ساعدتني إطلاق مشروعي بكل احترافية، والخدمة كانت سريعة وفوق المتوقع.
      </p>
    </div>

    {/* كارت تاني بلون مختلف */}
    <div className="bg-[#6D4DE9] text-white shadow-md rounded-lg p-6 w-[300px]">
      <img src="/boy.png" alt="client" className="w-16 h-16 mx-auto rounded-full" />
<h4 className="mt-4 font-semibold">Amira Zakaria</h4>
      <p className="text-sm">Senior Developer</p>
      <p className="mt-3 text-sm">
        منصة Frevix ساعدتني إطلاق مشروعي بكل احترافية، والخدمة كانت سريعة وفوق المتوقع.
      </p>
    </div>

    {/* كارت تالت */}
    <div className="bg-white shadow-md rounded-lg p-6 w-[300px]">
      <img src="/girl.png" alt="client" className="w-16 h-16 mx-auto rounded-full" />
      <h4 className="mt-4 font-semibold">Amira Zakaria</h4>
      <p className="text-sm text-gray-500">Senior Developer</p>
      <p className="mt-3 text-gray-700 text-sm">
        منصة Frevix ساعدتني إطلاق مشروعي بكل احترافية، والخدمة كانت سريعة وفوق المتوقع.
      </p>
    </div>
  </div>
</div>
    </section>
  )
}

export default Testimonials