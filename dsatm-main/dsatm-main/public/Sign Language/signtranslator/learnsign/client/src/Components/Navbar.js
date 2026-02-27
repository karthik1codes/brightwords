import React, { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../Assets/logo.png'
import './Navbar.css'

function Navbar() {
    const logoRef = useRef(null);
    const location = useLocation();

    const handleMouseMove = (e) => {
        const logo = logoRef.current;
        if (!logo) return;
        const rect = logo.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (y / rect.height) * 15;
        const rotateY = -(x / rect.width) * 15;
        logo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
        const logo = logoRef.current;
        if (!logo) return;
        logo.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };

    return (
        <nav className="navbar navbar-dark bg-dark navbar-expand-lg fixed-top py-3" id="mainNav">
            <div className="container px-4 px-lg-5">
                <Link to='/sign-kit/convert' className="navbar-brand mb-0 h1">
                    <img
                        src={logo}
                        width="30"
                        height="30"
                        className="d-inline-block align-top me-3 navbar-logo-tilt"
                        alt="BrightWords"
                        ref={logoRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{ transition: 'transform 0.2s cubic-bezier(.25,.8,.25,1)' }}
                    />
                    BrightWords
                </Link>
                <button className="navbar-toggler navbar-toggler-right" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarResponsive">
                    <ul className="navbar-nav ms-auto my-2 my-lg-0">
                        <li className="nav-item"><Link to='/sign-kit/convert' className={"nav-link" + (location.pathname === '/sign-kit/convert' ? ' active' : '')}>Convert</Link></li>
                        <li className="nav-item"><Link to='/sign-kit/learn-sign' className={"nav-link" + (location.pathname === '/sign-kit/learn-sign' ? ' active' : '')}>Learn Sign</Link></li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
