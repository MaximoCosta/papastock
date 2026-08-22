import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export function NotFoundPage() {
  return <EmptyState title="Página no encontrada" description="La ruta solicitada no existe en PapaStock." action={<Link to="/"><Button>Volver al dashboard</Button></Link>} />;
}
