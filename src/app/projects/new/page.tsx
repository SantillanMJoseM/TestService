import ProjectForm from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Nuevo proyecto
      </h1>
      <ProjectForm mode="create" />
    </div>
  );
}