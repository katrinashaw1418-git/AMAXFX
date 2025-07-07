import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Upload, 
  Download, 
  Eye,
  FileText,
  Camera,
  User,
  MapPin,
  CreditCard,
  Building
} from "lucide-react";

export default function Compliance() {
  const [kycStep, setKycStep] = useState(2);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);

  // Mock KYC data
  const kycStatus = {
    overall: "in_progress",
    steps: [
      { id: 1, title: "Identity Verification", status: "completed", icon: User, description: "Government ID verified" },
      { id: 2, title: "Address Verification", status: "in_progress", icon: MapPin, description: "Proof of address pending" },
      { id: 3, title: "Source of Funds", status: "pending", icon: CreditCard, description: "Income verification required" },
      { id: 4, title: "Risk Assessment", status: "pending", icon: Shield, description: "Questionnaire completion" },
    ]
  };

  const documents = [
    { id: 1, type: "passport", name: "Passport Copy", status: "approved", uploadDate: "2024-01-10", size: "2.4 MB" },
    { id: 2, type: "address", name: "Utility Bill", status: "under_review", uploadDate: "2024-01-12", size: "1.8 MB" },
    { id: 3, type: "bank_statement", name: "Bank Statement", status: "pending", uploadDate: "", size: "" },
    { id: 4, type: "income", name: "Income Statement", status: "pending", uploadDate: "", size: "" },
  ];

  const complianceMetrics = [
    { label: "KYC Completion", value: 65, status: "in_progress" },
    { label: "AML Screening", value: 100, status: "completed" },
    { label: "Document Verification", value: 50, status: "in_progress" },
    { label: "Risk Assessment", value: 0, status: "pending" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "in_progress":
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return CheckCircle;
      case "in_progress":
      case "under_review":
        return Clock;
      case "pending":
        return Clock;
      case "rejected":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedDocument(file);
      // Handle file upload logic here
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Center</h1>
          <p className="text-gray-600">Manage your verification status and regulatory compliance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Tier 2 Verified</p>
            <p className="text-xs text-gray-500">Premium access enabled</p>
          </div>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {complianceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="kyc" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kyc">KYC Status</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="risk">Risk Profile</TabsTrigger>
          <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
        </TabsList>

        {/* KYC Status Tab */}
        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Know Your Customer (KYC) Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {kycStatus.steps.map((step) => {
                  const Icon = step.icon;
                  const StatusIcon = getStatusIcon(step.status);
                  
                  return (
                    <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-medium">{step.title}</h3>
                          <Badge className={getStatusColor(step.status)}>
                            {step.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      <StatusIcon className={`w-5 h-5 ${
                        step.status === 'completed' ? 'text-green-600' : 
                        step.status === 'in_progress' ? 'text-yellow-600' : 
                        'text-gray-400'
                      }`} />
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Next Steps</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Complete your address verification by uploading a recent utility bill or bank statement.
                    </p>
                    <Button size="sm">
                      Continue Verification
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => {
                  const StatusIcon = getStatusIcon(doc.status);
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {doc.uploadDate && (
                              <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                            )}
                            {doc.size && <span>Size: {doc.size}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                        {doc.status === "pending" ? (
                          <Button size="sm">
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Upload New Document</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>Choose Files</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Profile Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Questionnaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="investment-experience">Investment Experience</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novice">Novice (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (3-7 years)</SelectItem>
                      <SelectItem value="experienced">Experienced (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="annual-income">Annual Income (USD)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-50k">Under $50,000</SelectItem>
                      <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                      <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                      <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                      <SelectItem value="over-500k">Over $500,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="investment-goals">Primary Investment Goals</Label>
                  <Textarea 
                    id="investment-goals"
                    placeholder="Describe your investment objectives, time horizon, and risk tolerance..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="source-of-funds">Source of Funds</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employment">Employment Income</SelectItem>
                      <SelectItem value="business">Business Income</SelectItem>
                      <SelectItem value="investments">Investment Returns</SelectItem>
                      <SelectItem value="inheritance">Inheritance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  Complete Risk Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulatory Tab */}
        <TabsContent value="regulatory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">FINTRAC (Canada)</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mb-2">Compliant</Badge>
                    <p className="text-sm text-gray-600">
                      Money Services Business registration and AML compliance verified.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">GDPR (EU)</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mb-2">Compliant</Badge>
                    <p className="text-sm text-gray-600">
                      Data protection and privacy regulations compliance confirmed.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">PIPEDA (Canada)</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mb-2">Compliant</Badge>
                    <p className="text-sm text-gray-600">
                      Personal Information Protection and Electronic Documents Act compliance.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">FinCEN (US)</h3>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 mb-2">Pending</Badge>
                    <p className="text-sm text-gray-600">
                      Financial Crimes Enforcement Network registration in progress.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Regulatory Updates</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• New AML guidelines effective Q2 2024</li>
                    <li>• Enhanced due diligence requirements for high-value transactions</li>
                    <li>• Updated privacy policy in compliance with latest regulations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
