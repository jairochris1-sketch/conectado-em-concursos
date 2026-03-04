import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function CourseCreatorAdmin() {
  const [permissions, setPermissions] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await base44.entities.CourseCreatorPermission.list();
      setPermissions(data);
    } catch (error) {
      toast.error("Erro ao carregar permissões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("E-mail inválido");
      return;
    }
    try {
      const user = await base44.auth.me();
      await base44.entities.CourseCreatorPermission.create({
        user_email: newEmail.trim().toLowerCase(),
        granted_by: user.email,
        is_active: true
      });
      toast.success("Permissão concedida!");
      setNewEmail("");
      loadData();
    } catch (error) {
      toast.error("Erro ao conceder permissão");
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm("Remover permissão deste usuário?")) {
      try {
        await base44.entities.CourseCreatorPermission.delete(id);
        toast.success("Permissão removida");
        loadData();
      } catch (error) {
        toast.error("Erro ao remover permissão");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criadores de Cursos (Alunos)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="E-mail do aluno..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={handleAdd} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Conceder Permissão
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail do Usuário</TableHead>
              <TableHead>Data de Concessão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.user_email}</TableCell>
                <TableCell>{new Date(p.created_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemove(p.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {permissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                  Nenhuma permissão concedida ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}