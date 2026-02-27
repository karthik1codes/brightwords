import React, { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Modal, Button, Form } from 'react-bootstrap'
import logo from '../Assets/logo.png'
import { signLanguageFetch, getAiApiBase } from '../utils/signLanguageApi'
import './Navbar.css'

function Navbar() {
    const logoRef = useRef(null);
    const location = useLocation();
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatReply, setChatReply] = useState('');
    const [chatError, setChatError] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);

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

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const msg = (chatMessage || '').trim();
        if (!msg) return;
        setLoadingChat(true);
        setChatError('');
        setChatReply('');
        const base = getAiApiBase();
        try {
            const data = await signLanguageFetch(`${base}/api/sign-language/chat`, {
                method: 'POST',
                body: JSON.stringify({ message: msg }),
            });
            setChatReply(data.reply || '');
            setChatMessage('');
        } catch (err) {
            setChatError(err.message || 'Could not get reply');
        } finally {
            setLoadingChat(false);
        }
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
                        <li className="nav-item"><Link to='/sign-kit/animate-with-ai' className={"nav-link" + (location.pathname === '/sign-kit/animate-with-ai' ? ' active' : '')}>Animate with AI</Link></li>
                        <li className="nav-item"><Link to='/sign-kit/ai-signing-video' className={"nav-link" + (location.pathname === '/sign-kit/ai-signing-video' ? ' active' : '')}>AI Signing Video</Link></li>
                        <li className="nav-item">
                            <button type="button" className="nav-link btn btn-link" onClick={() => setShowChat(true)} style={{ border: 'none', background: 'none' }}>Ask AI</button>
                        </li>
                    </ul>
                </div>
            </div>

            <Modal show={showChat} onHide={() => { setShowChat(false); setChatError(''); setChatReply(''); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Sign Language tutor</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleChatSubmit}>
                        <Form.Group className="mb-2">
                            <Form.Control as="textarea" rows={2} placeholder="Ask how to sign something or what a sign means..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                        </Form.Group>
                        <Button type="submit" variant="primary" size="sm" disabled={loadingChat}>{loadingChat ? '...' : 'Send'}</Button>
                    </Form>
                    {chatError && <p className="text-danger small mt-2 mb-0">{chatError}</p>}
                    {chatReply && <div className="mt-3 p-2 bg-light rounded"><p className="mb-0 small">{chatReply}</p></div>}
                </Modal.Body>
            </Modal>
        </nav>
    )
}

export default Navbar
