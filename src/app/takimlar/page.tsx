"use client";

import { useState, useEffect } from "react";
import { Users, Search, Filter, Trophy, Phone, Calendar } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Types
interface Team {
  id: string;
  teamName: string;
  coachName: string;
  phoneNumber: string;
  stage: string;
  ageGroups: string[];
  description?: string;
  logoUrl?: string;
  createdAt: string;
}

// Constants for filtering
const STAGES = [
  { value: "STAGE_1", label: "1. Etap" },
  { value: "STAGE_2", label: "2. Etap" },
  { value: "STAGE_3", label: "3. Etap" },
  { value: "STAGE_4", label: "4. Etap" },
  { value: "FINAL", label: "Final" },
];

const AGE_GROUPS = [
  { value: "Y2012", label: "2012" },
  { value: "Y2013", label: "2013" },
  { value: "Y2014", label: "2014" },
  { value: "Y2015", label: "2015" },
  { value: "Y2016", label: "2016" },
  { value: "Y2017", label: "2017" },
  { value: "Y2018", label: "2018" },
  { value: "Y2019", label: "2019" },
  { value: "Y2020", label: "2020" },
  { value: "Y2021", label: "2021" },
  { value: "Y2022", label: "2022" },
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams");
        if (response.ok) {
          const data = await response.json();
          setTeams(data);
          setFilteredTeams(data);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Filter teams based on search and filters
  useEffect(() => {
    let filtered = teams;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.coachName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stage filter
    if (selectedStage !== "all") {
      filtered = filtered.filter((team) => team.stage === selectedStage);
    }

    // Age group filter
    if (selectedAgeGroup !== "all") {
      filtered = filtered.filter((team) =>
        team.ageGroups.includes(selectedAgeGroup)
      );
    }

    setFilteredTeams(filtered);
  }, [teams, searchTerm, selectedStage, selectedAgeGroup]);

  const getStageLabel = (stage: string) => {
    const stageObj = STAGES.find((s) => s.value === stage);
    return stageObj ? stageObj.label : stage;
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const ageObj = AGE_GROUPS.find((a) => a.value === ageGroup);
    return ageObj ? ageObj.label : ageGroup.replace("Y", "");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Takımlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Users className="mr-3 h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Katılımcı Takımlar</h1>
            <p className="text-gray-600">Turnuvaya katılımı onaylanmış takımlar</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Takım Ara
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Takım adı veya hoca adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="md:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etap
          </label>
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger>
              <SelectValue placeholder="Etap seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Etaplar</SelectItem>
              {STAGES.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yaş Grubu
          </label>
          <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Yaş grubu seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yaş Grupları</SelectItem>
              {AGE_GROUPS.map((ageGroup) => (
                <SelectItem key={ageGroup.value} value={ageGroup.value}>
                  {ageGroup.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          {filteredTeams.length} takım bulundu
          {teams.length !== filteredTeams.length && ` (${teams.length} toplam)`}
        </p>
        {(searchTerm || selectedStage !== "all" || selectedAgeGroup !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedStage("all");
              setSelectedAgeGroup("all");
            }}
          >
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {teams.length === 0 ? "Henüz onaylanmış takım bulunmuyor" : "Arama kriterlerinize uygun takım bulunamadı"}
          </h3>
          <p className="text-gray-600 mb-4">
            {teams.length === 0 
              ? "Başvurular onaylandıkça burada görüntülenecektir."
              : "Farklı filtreler deneyebilir veya arama teriminizi değiştirebilirsiniz."
            }
          </p>
          {teams.length === 0 && (
            <Link href="/basvuru" className="cursor-pointer">
              <Button>
                <Trophy className="mr-2 h-4 w-4" />
                Başvuru Yap
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{team.teamName}</CardTitle>
                    <CardDescription className="space-y-1 mt-1">
                      <div className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {team.coachName}
                      </div>
                      <div className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {team.phoneNumber}
                      </div>
                    </CardDescription>
                  </div>
                  {team.logoUrl && (
                    <div className="ml-4">
                      <img
                        src={team.logoUrl}
                        alt={`${team.teamName} logosu`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {getStageLabel(team.stage)}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Yaş Grupları:</p>
                    <div className="flex flex-wrap gap-1">
                      {team.ageGroups.map((ageGroup) => (
                        <Badge key={ageGroup} variant="outline" className="text-xs">
                          {getAgeGroupLabel(ageGroup)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {team.description && (
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {team.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                    <Calendar className="mr-1 h-3 w-3" />
                    Katılım: {new Date(team.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}