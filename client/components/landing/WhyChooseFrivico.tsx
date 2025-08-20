import { Image } from 'lucide-react'
import React from 'react'

const WhyChooseFrivico = () => {
  return (
    <section>
       <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-[#FFE7D4] p-10 w-full h-screen">
        <div className="text-right space-y-6 max-w-md">
          <h2 className="text-2xl font-bold text-gray-800">
            لماذا تختار Frevix؟
          </h2>
          <div className="space-y-3 text-gray-700 text-sm">
            <p>
              ✅ <span className="font-semibold">كفاءة وموثوقية</span> <br />
              جميع المستقلين يتم تقييمهم بناء على الأداء والتجربة السابقة.
            </p>
            <p>
              ✅ <span className="font-semibold">حماية الدفع</span> <br />
              نظام آمن لضمان تسليم العمل قبل تحويل المستحقات.
            </p>
            <p className='bg-white'>
              ✅ <span className="font-semibold ">سهولة الاستخدام</span> <br />
              واجهة بسيطة وسلسة تتيح لك إدارة مشاريعك أو طلباتك بكل سهولة.
            </p>
          </div>
        </div>

        <div className="flex ">
   <img src="/image3.png" alt="Handshake" className="w-70 h-90 rounded-xl object-cover" />
               
          <img
            src="/image2.png"
            alt="Freelancer"
            className="w-100 h-120 rounded-xl object-cover"
          />
          <img
            src="/image1.png"
            alt="Handshake"
            className="w-80 h-70 rounded-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

export default WhyChooseFrivico