import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import EmptyState from "../components/EmptyState";

export default function NotFoundPage({ message = "The page you are looking for does not exist." }: { message?: string }) {
  return (
    <div className="not-found">
      <EmptyState icon={<FileQuestion size={72} />} title="Not found" message={message} />
      <Link to="/drive" className="btn btn-primary">
        Go to My Drive
      </Link>
    </div>
  );
}
