import MapView from "./MapView";
import { Layout } from "@/components/layout";

/**
 * A simple, independent page that just renders the map.
 * No boundaries, no dashboard, just the raw map service.
 */
export default function MapPage() {
    return (
        <Layout>
            <MapView />
        </Layout>
    );
}
