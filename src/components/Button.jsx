import React from 'react'


const Button = ({ text, setResetClicked }) => {
    return (<button onClick={() => setResetClicked(false)} type="submit" className=" ml-2 rounded-md font-inter px-[66px] py-[10px] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text text-transparent border border-[#33D4B7]">
        {text}
    </button>)
}

export default Button