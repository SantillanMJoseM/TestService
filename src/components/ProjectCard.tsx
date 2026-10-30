import Link from "next/link";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    key: string;
    createdAt: string;
    _count?: {
      modules: number;
      testCases: number;
      executions: number;
    };
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mt-1">
            {project.key}
          </span>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {project._count && (
        <div className="flex gap-4 text-xs text-gray-500 mb-4">
          <span>Módulos: {project._count.modules}</span>
          <span>Casos: {project._count.testCases}</span>
          <span>Ejecuciones: {project._count.executions}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver detalle
        </Link>
        <Link
          href={`/projects/${project.id}/edit`}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Editar
        </Link>
      </div>
    </div>
  );
}