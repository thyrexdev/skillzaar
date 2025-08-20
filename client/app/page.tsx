
import Hero from '@/components/landing/Hero'
import WhyChooseFrivico from '@/components/landing/WhyChooseFrivico'
import WhyFreivico from '@/components/landing/WhyFreivico'
import Frevico from'@/components/landing/Frevico'
import React from 'react'
import Testimonials from '@/components/landing/Testimonials'
import Advertisement from '@/components/landing/Advertisement'
import Footer from '@/components/landing/Footer'

const page = () => {
  return (
   <>
   <Hero/>
   <WhyFreivico />
   <WhyChooseFrivico />
   <Frevico />
   <Testimonials/>
   <Advertisement/>
   <Footer/>
   </>
  )
}

export default page