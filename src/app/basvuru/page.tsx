"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";

// Form validation schema
const formSchema = z.object({
  teamName: z.string().min(2, "Takım adı en az 2 karakter olmalıdır"),
  coachName: z.string().min(2, "Antrenör adı en az 2 karakter olmalıdır"),
  phoneNumber: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  website: z.string().url("Geçerli bir web sitesi adresi giriniz").or(z.literal("")).optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  stage: z.enum(["STAGE_1", "STAGE_2"]),
  ageGroups: z.array(z.enum(["Y2012", "Y2013", "Y2014", "Y2015", "Y2016", "Y2017", "Y2018", "Y2019", "Y2020", "Y2021", "Y2022"])).min(1, "En az bir yaş grubu seçiniz"),
  ageGroupTeamCounts: z.record(z.string(), z.number().min(1).max(5)).optional(),
  description: z.string().optional(),
});

export default function ApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      coachName: "",
      phoneNumber: "",
      website: "",
      instagram: "",
      twitter: "",
      facebook: "",
      stage: undefined,
      ageGroups: [],
      ageGroupTeamCounts: {},
      description: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Handle logo upload if file is selected
      let logoUrl = null;
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          logoUrl = uploadResult.url;
        }
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          logoUrl,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        form.reset();
        setLogoFile(null);
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error("Submission error:", errorData);
        alert("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Başvuru Başarıyla Gönderildi!</h2>
            <p className="text-green-700 mb-4">
              Başvurunuz alınmıştır. Yöneticiler tarafından incelendikten sonra size bilgi verilecektir.
            </p>
            <p className="text-sm text-green-600">Ana sayfaya yönlendiriliyorsunuz...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
          <div className="flex items-center mb-4">
            <FileText className="mr-3 h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Turnuva Başvuru Formu</h1>
              <p className="text-gray-600">Takımınızın turnuvaya katılım başvurusunu yapın</p>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Başvuru Bilgileri</CardTitle>
            <CardDescription>
              Lütfen tüm zorunlu alanları eksiksiz doldurunuz. Başvurunuz yöneticiler tarafından 
              incelendikten sonra size bilgi verilecektir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Takım Adı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Takım adınızı giriniz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coachName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sorumlu Hoca Adı Soyadı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Hoca adı ve soyadını giriniz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İletişim Numarası *</FormLabel>
                      <FormControl>
                        <Input placeholder="0555 123 45 67" {...field} />
                      </FormControl>
                      <FormDescription>
                        Telefon numaranızı başında 0 ile birlikte giriniz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Web Sitesi</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://www.ornek.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="@kullanici_adi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="@kullanici_adi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="facebook.com/sayfa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turnuva Etapı *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Etap seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STAGE_1">1. Etap Tarihi</SelectItem>
                          <SelectItem value="STAGE_2">2. Etap Tarihi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageGroups"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Yaş Grupları *</FormLabel>
                        <FormDescription>
                          Takımınızın katılacağı yaş gruplarını seçiniz. Her yaş grubu için takım sayısını belirtebilirsiniz.
                        </FormDescription>
                      </div>
                      {[
                        { id: "Y2012", label: "2012 (12 yaş)" },
                        { id: "Y2013", label: "2013 (11 yaş)" },
                        { id: "Y2014", label: "2014 (10 yaş)" },
                        { id: "Y2015", label: "2015 (9 yaş)" },
                        { id: "Y2016", label: "2016 (8 yaş)" },
                        { id: "Y2017", label: "2017 (7 yaş)" },
                        { id: "Y2018", label: "2018 (6 yaş)" },
                        { id: "Y2019", label: "2019 (5 yaş)" },
                        { id: "Y2020", label: "2020 (4 yaş)" },
                        { id: "Y2021", label: "2021 (3 yaş)" },
                        { id: "Y2022", label: "2022 (2 yaş)" },
                      ].map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="ageGroups"
                          render={({ field }) => {
                            const isSelected = field.value?.includes(item.id as any);
                            return (
                              <div key={item.id} className="space-y-2">
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        const currentCounts = form.getValues("ageGroupTeamCounts") || {};
                                        if (checked) {
                                          field.onChange([...field.value, item.id]);
                                          // Set default team count to 1 when selected
                                          form.setValue("ageGroupTeamCounts", {
                                            ...currentCounts,
                                            [item.id]: 1
                                          });
                                        } else {
                                          field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                          // Remove team count when deselected
                                          const newCounts = { ...currentCounts };
                                          delete newCounts[item.id];
                                          form.setValue("ageGroupTeamCounts", newCounts);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                                
                                {isSelected && (
                                  <FormField
                                    control={form.control}
                                    name="ageGroupTeamCounts"
                                    render={({ field: countField }) => (
                                      <FormItem className="ml-6">
                                        <FormLabel className="text-sm text-gray-600">
                                          Takım Sayısı
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="1"
                                            max="5"
                                            className="w-20"
                                            value={countField.value?.[item.id] || 1}
                                            onChange={(e) => {
                                              const count = parseInt(e.target.value) || 1;
                                              countField.onChange({
                                                ...countField.value,
                                                [item.id]: count
                                              });
                                            }}
                                          />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                          Bu yaş grubunda kaç takımla katılacaksınız? (1-5)
                                        </FormDescription>
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FileUpload
                    onFileSelect={setLogoFile}
                    accept="image/*"
                    maxSize={5}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Takım Hakkında (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Takımınız hakkında kısa bilgi verebilirsiniz..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Takımınızın özelliklerini, başarılarını veya hedeflerini kısaca açıklayabilirsiniz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Başvuruyu Gönder
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Başvuru Süreci Hakkında</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Başvurunuz gönderildikten sonra yöneticiler tarafından incelenecektir</li>
            <li>• Başvuru durumunuz hakkında iletişim numaranızdan bilgilendirileceksiniz</li>
            <li>• Onaylanan takımlar "Katılımcı Takımlar" sayfasında görüntülenecektir</li>
            <li>• Sorularınız için iletişim bilgilerinizi doğru girdiğinizden emin olun</li>
          </ul>
        </div>
      </div>
    </div>
  );
}