export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-container">
            <nav>
                <ul>
                    <li>
                        <a href="/">Home</a>
                    </li>
                    <li>
                        <a href="/about">About</a>
                    </li>
                </ul>
            </nav>
            <main>
                {children}
            </main>
        </div>
    );
}