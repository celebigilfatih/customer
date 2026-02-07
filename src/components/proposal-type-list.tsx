"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { getProposalTypes, addProposalType, updateProposalType, deleteProposalType } from "@/lib/settings-client"
import type { ProposalTypeSetting } from "@/lib/settings-client"
import { ProposalTypeForm } from "./proposal-type-form"

export function ProposalTypeList() {
  const [types, setTypes] = useState<ProposalTypeSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<ProposalTypeSetting | null>(null)

  const fetchTypes = async () => {
    setLoading(true)
    try {
      const data = await getProposalTypes()
      setTypes(data)
    } catch (error) {
      toast.error("Teklif türleri yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  const handleAdd = async (data: { name: string; label: string; isActive: boolean }) => {
    try {
      const result = await addProposalType(data)
      if (result) {
        await fetchTypes()
        setShowForm(false)
        toast.success("Teklif türü eklendi")
      } else {
        toast.error("Bu teknik ad zaten mevcut")
      }
    } catch (error) {
      toast.error("Ekleme başarısız")
    }
  }

  const handleUpdate = async (data: { name: string; label: string; isActive: boolean }) => {
    if (!editingType) return
    
    try {
      const result = await updateProposalType(editingType.id, data)
      if (result) {
        await fetchTypes()
        setEditingType(null)
        toast.success("Teklif türü güncellendi")
      } else {
        toast.error("Güncelleme başarısız")
      }
    } catch (error) {
      toast.error("Güncelleme başarısız")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu teklif türünü silmek istediğinizden emin misiniz?")) return
    
    try {
      const success = await deleteProposalType(id)
      if (success) {
        await fetchTypes()
        toast.success("Teklif türü silindi")
      } else {
        toast.error("Silme başarısız")
      }
    } catch (error) {
      toast.error("Silme başarısız")
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingType(null)
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teklif Türleri</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Tür Ekle
          </Button>
        </div>
      </div>

      {showForm && (
        <ProposalTypeForm
          onSubmit={handleAdd}
          onCancel={handleCancel}
        />
      )}

      {editingType && (
        <ProposalTypeForm
          initialData={editingType}
          onSubmit={handleUpdate}
          onCancel={handleCancel}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Türler</CardTitle>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz teklif türü eklenmemiş
            </div>
          ) : (
            <div className="space-y-3">
              {types.map((type) => (
                <div
                  key={type.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${type.isActive ? 'hover:bg-gray-50' : 'bg-gray-100 opacity-75'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{type.label}</span>
                      <Badge variant="secondary">{type.name}</Badge>
                      {type.isActive ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-300 text-gray-700">
                          <X className="h-3 w-3 mr-1" />
                          Pasif
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingType(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
