const Footer = () => {
    const telegramUrl = import.meta.env.VITE_CONTACT_TG_URL || '';
    const instagramUrl = import.meta.env.VITE_CONTACT_IG_URL || '';
    const buildSha = typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'dev';

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <p className="footer-brand">
                    &copy; 2024 magmostudio (v1.2, {buildSha}). All rights reserved.
                </p>

                <div className="footer-contacts">
                    <a className="footer-link footer-email" href="mailto:koriahinsasha62@gmail.com">
                        koriahinsasha62@gmail.com
                    </a>

                    <div className="footer-links">
                        {telegramUrl ? (
                            <a className="footer-link" href={telegramUrl} target="_blank" rel="noreferrer noopener">
                                Telegram
                            </a>
                        ) : null}
                        {instagramUrl ? (
                            <a className="footer-link" href={instagramUrl} target="_blank" rel="noreferrer noopener">
                                Instagram
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
