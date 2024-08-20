import React from 'react'

const Header = () => {
  return (
    <div className ='sticky top-0 z-50'>
      <header className='flex  items-center justify-between gap-4 p-4'>
        <h1>Free<span className='text-blue-400 gap-2'>Scribe</span></h1>
        <button className='flex items-center gap-2 speciaBtn'>
          <p>New</p>
          <i className="fa-solid fa-plus"></i>
        </button>
      </header>
    </div>
  )
}

export default Header
