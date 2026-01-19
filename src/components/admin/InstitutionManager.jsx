import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function InstitutionManager() {
  const [institutions, setInstitutions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", value: "", order: 0 });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const data = await base44.entities.Institution.list("order");
      setInstitutions(data);
    } catch (error) {
      toast.error("Erro ao carregar bancas");
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await base44.entities.Institution.update(editingId, formData);
        toast.success("Banca atualizada!");
      } else {
        await base44.entities.Institution.create(formData);
        toast.success("Banca criada!");
      }

      setIsOpen(false);
      setFormData({ name: "", value: "", order: 0 });
      setEditingId(null);
      loadInstitutions();
    } catch (error) {
      toast.error("Erro ao salvar banca");
    }
  };

  const handleEdit = (institution) => {
    setEditingId(institution.id);
    setFormData({
      name: institution.name,
      value: institution.value,
      order: institution.order || 0,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta banca?")) return;

    try {
      await base44.entities.Institution.delete(id);
      toast.success("Banca excluída!");
      loadInstitutions();
    } catch (error) {
      toast.error("Erro ao excluir banca");
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setFormData({ name: "", value: "", order: 0 });
      setEditingId(null);
    }
    setIsOpen(open);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bancas de Concurso</h3>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Banca
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Banca" : "Nova Banca"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome da Banca
                </label>
                <Input
                  placeholder="Ex: FCC"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Identificador
                </label>
                <Input
                  placeholder="Ex: fcc"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ordem
                </label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {institutions.map((institution) => (
          <Card key={institution.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{institution.name}</p>
                <p className="text-sm text-gray-500">{institution.value}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(institution)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(institution.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}