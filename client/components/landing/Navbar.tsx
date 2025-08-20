import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { SelectScrollUpButton } from '../ui/select'

const Navbar = () => {
  return (
        <nav className='  absolute w-full flex justify-between py-6  items-center  bg-[#A89EF2] border-y-2 px-12 my-6 ' >    
            <div className='text-3xl font-bold'><Link href={'/'}>Frevix</Link></div>
            <ul className='flex gap-9 '>
                <li><Link href={''}>الرئيسيه</Link></li>
                <li><Link href={''}>تصفح الخدمات</Link></li>
                <li><Link href={''}>انشر المشروع</Link></li>
                <li><Link href={''}>اعمالي</Link></li>
                <li><Link href={''}>عروضي</Link></li>
            </ul>
             <div className='flex gap-6'> 
               <Button>انشاء حساب</Button>
             <Button>تسجيل الدخول </Button>
              <Button> English</Button>
                 </div>
        </nav>
  )
}
export default Navbar