import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Image } from '../core-components';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__logo">
        <Image src="/img/logo-light.png" alt="eternal-expenditions logo" />
      </div>
      <ul className="footer__nav">
        <li>
          <Link to="/about">About us</Link>
        </li>
        <li>
          <Link to="/become-guide">Become a guide</Link>
        </li>
        <li>
          <Link to="/careers">Careers</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
      <p className="footer__copyright">
        &copy; <strong>Abhishek Kushwaha</strong> - Feel free to use this project for your learning
        purposes!
      </p>
    </footer>
  );
}

export default memo(Footer);
