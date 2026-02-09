import { useState } from "react";

export function Dashboard() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
    );
}