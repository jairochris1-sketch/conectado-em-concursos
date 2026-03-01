import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FollowButton from "@/components/social/FollowButton";
import { base44 } from "@/api/base44Client";

export default function PeoplePage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getPeople', { search: '' });
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pessoas</h1>
            <p className="text-gray-500">Descubra e conecte-se com outros estudantes</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar pessoas..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><p className="text-gray-500">Carregando...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map(person => (
              <Card key={person.email} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <Link to={`${createPageUrl('Profile')}?email=${encodeURIComponent(person.email)}`} className="mb-3">
                    <Avatar className="w-20 h-20 border-2 border-gray-100">
                      <AvatarImage src={person.photo} />
                      <AvatarFallback>{person.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link to={`${createPageUrl('Profile')}?email=${encodeURIComponent(person.email)}`}>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                      {person.name || 'Usuário sem nome'}
                    </h3>
                  </Link>
                  
                  {(person.location || person.job_title) && (
                    <div className="text-xs text-gray-500 mt-2 space-y-1 flex flex-col items-center">
                      {person.job_title && (
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {person.job_title}</span>
                      )}
                      {person.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {person.location}</span>
                      )}
                    </div>
                  )}

                  <div className="text-sm text-gray-500 mt-3 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    Nível {person.level} • {person.points} pts
                  </div>

                  <div className="flex gap-2 w-full mt-4 justify-center">
                    <FollowButton 
                      targetEmail={person.email} 
                      targetName={person.name} 
                      targetPhotoUrl={person.photo} 
                      size="sm" 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Nenhuma pessoa encontrada.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}