import { User } from '../../models';

export class ArIdGenerator {
  private static instance: ArIdGenerator;
  private currentId: number = 0;

  private constructor() {}

  public static getInstance(): ArIdGenerator {
    if (!ArIdGenerator.instance) {
      ArIdGenerator.instance = new ArIdGenerator();
    }
    return ArIdGenerator.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // 기존 DB에서 가장 큰 arId 찾기
      const lastUser = await User.findOne({}, { arId: 1 })
        .sort({ arId: -1 })
        .lean();

      if (lastUser && lastUser.arId) {
        this.currentId = parseInt(lastUser.arId);
      }
      
      console.log(`ArId Generator initialized. Starting from: ${this.currentId}`);
    } catch (error) {
      console.error('Error initializing ArId Generator:', error);
      this.currentId = 0;
    }
  }

  public async generateNextArId(): Promise<string> {
    let nextId = this.currentId + 1;
    let arId = this.formatArId(nextId);
    
    // 중복 검사
    while (await this.isArIdExists(arId)) {
      nextId++;
      arId = this.formatArId(nextId);
    }
    
    this.currentId = nextId;
    return arId;
  }

  private formatArId(id: number): string {
    return id.toString().padStart(3, '0');
  }

  private async isArIdExists(arId: string): Promise<boolean> {
    try {
      const existing = await User.findOne({ arId }).lean();
      return !!existing;
    } catch (error) {
      console.error('Error checking arId existence:', error);
      return false;
    }
  }

  public getCurrentId(): number {
    return this.currentId;
  }
}